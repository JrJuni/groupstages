/**
 * ELO 서비스 — eloratings.net 기반
 *
 * 캐시 파일: cache/elo_worldcup_2026.json
 * 소스: https://eloratings.net/World.tsv  (공개 TSV, 열: rank / prev_rank / code / elo / ...)
 *
 * 캐시 구조:
 * {
 *   "fetchedAt":       "2026-06-12T06:00:00.000Z",
 *   "todayDate":       "2026-06-12",
 *   "todayFetchCount": 2,
 *   "data": {
 *     "ESP": { "elo": 2172, "eloCode": "ES", "rank": 1 },
 *     "ARG": { "elo": 2113, "eloCode": "AR", "rank": 2 },
 *     ...
 *   },
 *   "unmapped": [
 *     { "eloCode": "XX", "elo": 1500, "rank": 99 }
 *   ]
 * }
 */

import fs from 'fs/promises';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';
import { createStaleRefresher } from './_staleRefresh.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_PATH = path.join(__dirname, '../../cache/elo_worldcup_2026.json');

// 하루 최대 fetch 횟수 (경기 후 재계산 고려)
const MAX_DAILY_FETCHES = 10;

// ── eloratings.net 코드 → 우리 팀 ID 매핑 ──────────────────────────
// eloratings.net은 독자적 2자리 코드를 사용 (IOC/FIFA와 다름)
// 2026 월드컵 48팀 전체 커버
const ELO_CODE_TO_TEAM_ID = {
  // UEFA (13팀)
  'ES': 'ESP',   // Spain
  'EN': 'ENG',   // England
  'FR': 'FRA',   // France
  'DE': 'GER',   // Germany
  'PT': 'POR',   // Portugal
  'NL': 'NED',   // Netherlands
  'HR': 'CRO',   // Croatia
  'CH': 'CHE',   // Switzerland
  'AT': 'AUT',   // Austria
  'BE': 'BEL',   // Belgium
  'NO': 'NOR',   // Norway
  'DK': 'DEN',   // Denmark — 우리 ID: NOR/DEN 확인 필요
  'SQ': 'SCO',   // Scotland (eloratings: SQ)
  // UEFA PO 슬롯은 미확정이므로 제외

  // CONMEBOL (6팀)
  'AR': 'ARG',   // Argentina
  'BR': 'BRA',   // Brazil
  'UY': 'URU',   // Uruguay
  'CO': 'COL',   // Colombia
  'EC': 'ECU',   // Ecuador
  'PY': 'PAR',   // Paraguay

  // CONCACAF (6팀)
  'US': 'USA',   // United States
  'MX': 'MEX',   // Mexico
  'CA': 'CAN',   // Canada
  'PA': 'PAN',   // Panama
  'CW': 'CUW',   // Curaçao
  'HT': 'HTI',   // Haiti

  // CAF (9팀)
  'MA': 'MAR',   // Morocco
  'SN': 'SEN',   // Senegal
  'NG': 'NGA',   // Nigeria (우리 ID 확인)
  'EG': 'EGY',   // Egypt
  'DZ': 'ALG',   // Algeria
  'CI': 'CIV',   // Côte d'Ivoire
  'TN': 'TUN',   // Tunisia
  'GH': 'GHA',   // Ghana
  'ZA': 'RSA',   // South Africa

  // AFC (8팀)
  'JP': 'JPN',   // Japan
  'KR': 'KOR',   // South Korea
  'IR': 'IRN',   // Iran
  'SA': 'SAU',   // Saudi Arabia
  'AU': 'AUS',   // Australia
  'JO': 'JOR',   // Jordan
  'UZ': 'UZB',   // Uzbekistan
  'QA': 'QAT',   // Qatar

  // OFC (1팀)
  'NZ': 'NZL',   // New Zealand

  // 미확정 인터콘티넨털 플레이오프 슬롯 → 매핑 불가 (제외)
  // CV → CPV: Cape Verde — AFC/CAF가 아닌 인터콘티넨털 PO 참여 가능성
  'CV': 'CPV',   // Cape Verde
};

// 역방향 (우리 ID → eloCode), 편의용
export const TEAM_ID_TO_ELO_CODE = Object.fromEntries(
  Object.entries(ELO_CODE_TO_TEAM_ID).map(([k, v]) => [v, k])
);

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

/** 캐시 파일 저장 */
async function writeCache(payload) {
  await fs.mkdir(path.dirname(CACHE_PATH), { recursive: true });
  await fs.writeFile(CACHE_PATH, JSON.stringify(payload, null, 2), 'utf-8');
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
 * 캐시된 ELO 반환 (TTL 없음 — 경기 후 수동 갱신)
 */
export async function getEloCached() {
  const { cache } = await getCacheStatus();
  return cache ?? null;
}

/**
 * eloratings.net World.tsv 파싱 + 캐시 저장
 *
 * TSV 열 순서 (헤더 없음):
 *   0: rank  1: prev_rank  2: eloCode  3: elo  ...이후 기록
 *
 * @param {string} tsvText - fetch한 TSV 원문
 */
export async function saveEloFromTsv(tsvText) {
  const today = todayKST();
  const existing = await readCache();
  const prevCount = existing?.todayDate === today ? (existing.todayFetchCount ?? 0) : 0;

  const data = {};
  const unmapped = [];

  for (const line of tsvText.split('\n')) {
    const cols = line.split('\t');
    if (cols.length < 4) continue;

    const rank = parseInt(cols[0], 10);
    const eloCode = cols[2]?.trim();
    const elo = parseInt(cols[3], 10);

    if (!eloCode || isNaN(elo)) continue;

    const teamId = ELO_CODE_TO_TEAM_ID[eloCode];
    if (teamId) {
      data[teamId] = { elo, eloCode, rank };
    } else {
      unmapped.push({ eloCode, elo, rank });
    }
  }

  const payload = {
    fetchedAt: new Date().toISOString(),
    todayDate: today,
    todayFetchCount: prevCount + 1,
    data,
    unmapped,
  };

  await writeCache(payload);
  console.log(`[ELO] 저장 완료: ${Object.keys(data).length}팀 매핑, ${unmapped.length}팀 미매핑`);
  return payload;
}

/**
 * eloratings.net/World.tsv fetch (Node 내장 https)
 * — UA 헤더 필수, 10s 타임아웃
 */
export function fetchEloTsv() {
  return new Promise((resolve, reject) => {
    const req = https.get(
      'https://eloratings.net/World.tsv',
      { headers: { 'User-Agent': 'Mozilla/5.0 (GroupStages/1.0)' } },
      (res) => {
        if (res.statusCode !== 200) {
          return reject(new Error(`eloratings.net HTTP ${res.statusCode}`));
        }
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => resolve(body));
      }
    );
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('eloratings.net 타임아웃')); });
  });
}

/**
 * ELO 갱신 한 번에 (fetch + parse + save)
 */
export async function refreshElo() {
  const tsv = await fetchEloTsv();
  return saveEloFromTsv(tsv);
}

/**
 * stale 캐시 자동 갱신 (Phase 3.5)
 * 호출 측: refreshIfStale({ maxAgeHours: 24, refreshFn: refreshElo })
 */
export const refreshIfStale = createStaleRefresher(getCacheStatus, 'ELO');
