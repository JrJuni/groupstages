/**
 * 팀 폼 서비스 — API-Football 기반
 *
 * 캐시 파일: cache/team_form_worldcup_2026.json
 * 소스: API-Football /fixtures?team={api_team_id}&last=10
 *
 * 캐시 구조:
 * {
 *   "fetchedAt":       "2026-04-12T06:00:00.000Z",
 *   "todayDate":       "2026-04-12",
 *   "todayFetchCount": 1,
 *   "data": {
 *     "ESP": { "n": 10, "gfPerGame": 2.10, "gaPerGame": 0.80, "lastUpdated": "..." },
 *     "ARG": { "n":  9, "gfPerGame": 1.78, "gaPerGame": 0.67, "lastUpdated": "..." }
 *   },
 *   "skipped": [
 *     { "teamId": "XXX", "reason": "no api_team_id mapping" }
 *   ]
 * }
 *
 * 설계 원칙
 * - eloService.js 패턴 미러 (캐시/일일제한/atomic write).
 * - 데이터 fetch는 호출 측이 주입한 apiClient/teamMapping으로만. 엔진/프론트엔드 무관.
 * - n < MIN_FORM_N 데이터는 그대로 저장 — sparse 처리는 matchPredictor 측에서 수행.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createStaleRefresher } from './_staleRefresh.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_PATH = path.join(__dirname, '../../cache/team_form_worldcup_2026.json');

// 하루 최대 refresh 횟수 (refresh 1회 = 48 req)
const MAX_DAILY_FETCHES = 10;

// 폼 집계 대상 경기 수
const FORM_LAST_N = 10;

/** KST 기준 오늘 날짜 YYYY-MM-DD */
function todayKST() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** 캐시 파일 읽기 */
async function readCache() {
  try {
    return JSON.parse(await fs.readFile(CACHE_PATH, 'utf-8'));
  } catch {
    return null;
  }
}

/** 캐시 파일 atomic 저장 (temp → rename) */
async function writeCache(payload) {
  await fs.mkdir(path.dirname(CACHE_PATH), { recursive: true });
  const tmpPath = `${CACHE_PATH}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(payload, null, 2), 'utf-8');
  await fs.rename(tmpPath, CACHE_PATH);
}

/**
 * 캐시 상태 반환
 */
export async function getCacheStatus() {
  const cache = await readCache();
  if (!cache) {
    return { cache: null, todayCount: 0, canFetchToday: true, ageSeconds: null };
  }
  const ageSeconds = Math.floor((Date.now() - new Date(cache.fetchedAt).getTime()) / 1000);
  const today = todayKST();
  const todayCount = cache.todayDate === today ? (cache.todayFetchCount ?? 0) : 0;
  const canFetchToday = todayCount < MAX_DAILY_FETCHES;
  return { cache, todayCount, canFetchToday, ageSeconds };
}

/**
 * 캐시된 폼 데이터 반환 (TTL 없음 — 수동 weekly refresh)
 */
export async function getCached() {
  const { cache } = await getCacheStatus();
  return cache ?? null;
}

/**
 * API-Football fixture 응답에서 (gf, ga) 추출
 * — 대상 팀이 home인지 away인지 판정 후 fixture goals를 그 관점으로 정규화
 *
 * @param {object} fixture - API-Football /fixtures 응답의 한 항목
 * @param {number} apiTeamId
 * @returns {{ gf: number, ga: number } | null}  완료(FT/AET/PEN)가 아니거나 데이터 누락 시 null
 */
function extractTeamGoals(fixture, apiTeamId) {
  const status = fixture?.fixture?.status?.short;
  // 종료된 경기만 폼에 반영 (FT, AET=연장종료, PEN=승부차기종료)
  if (!['FT', 'AET', 'PEN'].includes(status)) return null;

  const homeId = fixture?.teams?.home?.id;
  const awayId = fixture?.teams?.away?.id;
  const homeGoals = fixture?.goals?.home;
  const awayGoals = fixture?.goals?.away;

  if (homeGoals == null || awayGoals == null) return null;

  if (homeId === apiTeamId) {
    return { gf: homeGoals, ga: awayGoals };
  }
  if (awayId === apiTeamId) {
    return { gf: awayGoals, ga: homeGoals };
  }
  return null;
}

/**
 * fixture 배열을 평균 GF/GA로 집계
 *
 * @param {Array} fixtures
 * @param {number} apiTeamId
 * @returns {{ n: number, gfPerGame: number, gaPerGame: number }}
 */
export function aggregateForm(fixtures, apiTeamId) {
  let n = 0;
  let totalGf = 0;
  let totalGa = 0;

  for (const f of fixtures) {
    const goals = extractTeamGoals(f, apiTeamId);
    if (!goals) continue;
    n++;
    totalGf += goals.gf;
    totalGa += goals.ga;
  }

  if (n === 0) {
    return { n: 0, gfPerGame: 0, gaPerGame: 0 };
  }

  return {
    n,
    gfPerGame: +(totalGf / n).toFixed(3),
    gaPerGame: +(totalGa / n).toFixed(3),
  };
}

/**
 * 모든 팀 폼 데이터 새로고침 (호출 측이 매핑/API 클라이언트 주입)
 *
 * @param {Object} options
 * @param {Record<string, number>} options.teamMapping  - { our_team_id: api_team_id }
 * @param {(apiTeamId: number, n: number) => Promise<Array>} options.fetchLastN
 *        API-Football /fixtures?team=&last= 호출 콜백. 호출 측이 apiFootballService.getLastNFixtures를 주입.
 * @param {number} [options.lastN=10]
 * @returns {Promise<object>} 저장된 캐시 페이로드
 */
export async function refreshAll({ teamMapping, fetchLastN, lastN = FORM_LAST_N }) {
  if (!teamMapping || typeof teamMapping !== 'object') {
    throw new Error('teamMapping(our_team_id → api_team_id)이 필요합니다');
  }
  if (typeof fetchLastN !== 'function') {
    throw new Error('fetchLastN 콜백이 필요합니다');
  }

  const today = todayKST();
  const existing = await readCache();
  const prevCount = existing?.todayDate === today ? (existing.todayFetchCount ?? 0) : 0;

  const data = {};
  const skipped = [];
  const lastUpdated = new Date().toISOString();

  const teamIds = Object.keys(teamMapping);
  console.log(`[Form] ${teamIds.length}개 팀 폼 fetch 시작 (last=${lastN})...`);

  for (const ourTeamId of teamIds) {
    const apiTeamId = teamMapping[ourTeamId];
    if (!apiTeamId) {
      skipped.push({ teamId: ourTeamId, reason: 'no api_team_id mapping' });
      continue;
    }

    try {
      const fixtures = await fetchLastN(apiTeamId, lastN);
      const form = aggregateForm(fixtures || [], apiTeamId);
      data[ourTeamId] = { ...form, lastUpdated };
    } catch (err) {
      console.warn(`[Form] ${ourTeamId} (api ${apiTeamId}) fetch 실패: ${err.message}`);
      skipped.push({ teamId: ourTeamId, reason: err.message });
    }
  }

  const payload = {
    fetchedAt: new Date().toISOString(),
    todayDate: today,
    todayFetchCount: prevCount + 1,
    lastN,
    data,
    skipped,
  };

  await writeCache(payload);
  console.log(`[Form] 저장 완료: ${Object.keys(data).length}팀 집계, ${skipped.length}팀 스킵`);
  return payload;
}

export { FORM_LAST_N, MAX_DAILY_FETCHES };

/**
 * stale 캐시 자동 갱신 (Phase 3.5)
 * 호출 측: refreshIfStale({ maxAgeHours: 24, refreshFn: () => refreshAll({ teamMapping, fetchLastN }) })
 *
 * teamMapping/fetchLastN은 호출 측이 주입 (서비스는 DB/API client에 의존하지 않음 — 순수성 유지)
 */
export const refreshIfStale = createStaleRefresher(getCacheStatus, 'Form');
