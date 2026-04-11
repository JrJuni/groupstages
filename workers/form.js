/**
 * Cloudflare Workers — Team Form Sync
 * server/services/teamFormService.js 의 순수 집계 로직 포팅 (fs 의존 제거, D1 사용)
 *
 * 소스: API-Football /fixtures?team={apiTeamId}&last={n}
 * 48팀 × 1콜 = 48 req/refresh. 일 4회 cron = ~196 req/일 (할당량 7,500 중 ~2.6%)
 */

const API_BASE = 'https://v3.football.api-sports.io';
const FORM_LAST_N = 10;

/**
 * fixture 1건에서 대상 팀 관점의 (gf, ga) 추출
 * — 종료된 경기(FT/AET/PEN)만 카운트
 * — server/services/teamFormService.js:84-104 의 extractTeamGoals 와 동일
 */
function extractTeamGoals(fixture, apiTeamId) {
  const status = fixture?.fixture?.status?.short;
  if (!['FT', 'AET', 'PEN'].includes(status)) return null;

  const homeId = fixture?.teams?.home?.id;
  const awayId = fixture?.teams?.away?.id;
  const homeGoals = fixture?.goals?.home;
  const awayGoals = fixture?.goals?.away;

  if (homeGoals == null || awayGoals == null) return null;

  if (homeId === apiTeamId) return { gf: homeGoals, ga: awayGoals };
  if (awayId === apiTeamId) return { gf: awayGoals, ga: homeGoals };
  return null;
}

/**
 * fixture 배열을 평균 GF/GA로 집계
 * — server/services/teamFormService.js:111-143 의 aggregateForm 과 동일 로직
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

  if (n === 0) return { n: 0, gfPerGame: 0, gaPerGame: 0 };

  return {
    n,
    gfPerGame: +(totalGf / n).toFixed(3),
    gaPerGame: +(totalGa / n).toFixed(3),
  };
}

/**
 * API-Football /fixtures?team=&last= 호출
 * — workers/sync.js:11-36 의 fetchFixtures 패턴 미러
 */
async function fetchTeamLastN(env, apiTeamId, n) {
  const url = new URL(`${API_BASE}/fixtures`);
  url.searchParams.set('team', String(apiTeamId));
  url.searchParams.set('last', String(n));

  const resp = await fetch(url.toString(), {
    headers: { 'x-apisports-key': env.API_FOOTBALL_KEY },
  });

  if (!resp.ok) {
    const remaining = resp.headers.get('x-ratelimit-requests-remaining');
    if (resp.status === 429) throw new Error(`Rate Limit (remaining=${remaining})`);
    if (resp.status === 401) throw new Error('API 인증 실패 — API_FOOTBALL_KEY 확인');
    throw new Error(`API-Football HTTP ${resp.status}`);
  }

  const data = await resp.json();
  return data?.response ?? [];
}

/**
 * 메인 form sync 오케스트레이터 — cron + 수동 트리거 양쪽에서 호출
 *
 * ⚠️ SUBREQUEST BUDGET: 이 함수는 현재 48 fetch (48팀 × 1콜) 사용 중.
 * Workers 무료 티어 한도는 invocation 당 50건. **buffer 2건만 남음.**
 * - retry 로직 추가 금지
 * - 에러 webhook(Sentry/Discord) 추가 금지
 * - pagination 추가 금지
 * - 새 외부 fetch 추가 시 반드시 stale-only filter 또는 cron 추가 분리 필요
 * 자세한 가이드: docs/deploy.md "Workers 무료 티어 50 subrequest 한도" 섹션
 *
 * @returns {{ success, mapped, skipped, duration_ms, api_remaining?, error? }}
 */
export async function syncForm(env) {
  const startTime = Date.now();

  try {
    // 1. team_mapping 로드 (workers/sync.js:281-292 패턴)
    const { results: mappings } = await env.DB.prepare(
      'SELECT api_team_id, our_team_id FROM team_mapping'
    ).all();

    if (!mappings || mappings.length === 0) {
      throw new Error('team_mapping 비어있음 — D1에 매핑 데이터 먼저 insert');
    }

    // 2. 각 팀별 last=N fetch + aggregate
    const formData = {};
    const skipped = [];
    let lastRemaining = null;

    for (const m of mappings) {
      try {
        const fixtures = await fetchTeamLastN(env, m.api_team_id, FORM_LAST_N);
        const form = aggregateForm(fixtures, m.api_team_id);
        formData[m.our_team_id] = form;
      } catch (err) {
        console.warn(`[Form Sync] ${m.our_team_id} (api ${m.api_team_id}) 실패: ${err.message}`);
        skipped.push({ teamId: m.our_team_id, reason: err.message });
        // Rate limit 에러는 즉시 중단 (남은 fetch도 다 실패)
        if (err.message.includes('Rate Limit') || err.message.includes('인증')) {
          throw err;
        }
      }
    }

    const teamIds = Object.keys(formData);

    if (teamIds.length === 0) {
      throw new Error('집계된 팀이 0건');
    }

    // 3. D1 batch UPSERT
    const statements = teamIds.map((teamId) => {
      const { n, gfPerGame, gaPerGame } = formData[teamId];
      return env.DB.prepare(
        `INSERT INTO team_form (team_id, matches_n, gf_per_game, ga_per_game, last_n, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'))
         ON CONFLICT(team_id) DO UPDATE SET
           matches_n   = ?2,
           gf_per_game = ?3,
           ga_per_game = ?4,
           last_n      = ?5,
           updated_at  = datetime('now')`
      ).bind(teamId, n, gfPerGame, gaPerGame, FORM_LAST_N);
    });

    await env.DB.batch(statements);

    const duration = Date.now() - startTime;
    console.log(`[Form Sync] Done: ${teamIds.length} aggregated, ${skipped.length} skipped (${duration}ms)`);

    // 4. sync log 기록
    await env.DB.prepare(
      `INSERT INTO api_sync_log (sync_type, status, teams_synced, sync_duration_ms)
       VALUES (?1, ?2, ?3, ?4)`
    ).bind('form', 'success', teamIds.length, duration).run();

    return {
      success: true,
      mapped: teamIds.length,
      skipped: skipped.length,
      duration_ms: duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Form Sync] Failed: ${error.message}`);

    try {
      await env.DB.prepare(
        `INSERT INTO api_sync_log (sync_type, status, error_message, sync_duration_ms)
         VALUES (?1, ?2, ?3, ?4)`
      ).bind('form', 'failed', error.message, duration).run();
    } catch (_) { /* ignore */ }

    return { success: false, error: error.message, duration_ms: duration };
  }
}
