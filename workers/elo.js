/**
 * Cloudflare Workers — ELO Sync
 * server/services/eloService.js 의 순수 파싱 로직 포팅 (fs 의존 제거, D1 사용)
 *
 * 소스: https://eloratings.net/World.tsv (탭 구분, 헤더 없음)
 * 열: 0=rank  1=prev_rank  2=eloCode  3=elo  …이후 기록
 */

// ── eloratings.net 코드 → 우리 팀 ID 매핑 ──────────────────────────
// server/services/eloService.js 의 ELO_CODE_TO_TEAM_ID 와 동일.
// 듀얼 코드 컨벤션 (apiFootballService.js ↔ workers/sync.js와 같은 패턴).
const ELO_CODE_TO_TEAM_ID = {
  // UEFA
  ES: 'ESP', EN: 'ENG', FR: 'FRA', DE: 'GER', PT: 'POR',
  NL: 'NED', HR: 'CRO', CH: 'CHE', AT: 'AUT', BE: 'BEL',
  NO: 'NOR', DK: 'DEN', SQ: 'SCO',
  // CONMEBOL
  AR: 'ARG', BR: 'BRA', UY: 'URU', CO: 'COL', EC: 'ECU', PY: 'PAR',
  // CONCACAF
  US: 'USA', MX: 'MEX', CA: 'CAN', PA: 'PAN', CW: 'CUW', HT: 'HTI',
  // CAF
  MA: 'MAR', SN: 'SEN', NG: 'NGA', EG: 'EGY', DZ: 'ALG',
  CI: 'CIV', TN: 'TUN', GH: 'GHA', ZA: 'RSA',
  // AFC
  JP: 'JPN', KR: 'KOR', IR: 'IRN', SA: 'SAU', AU: 'AUS',
  JO: 'JOR', UZ: 'UZB', QA: 'QAT',
  // OFC
  NZ: 'NZL',
  // 기타
  CV: 'CPV',
};

/**
 * eloratings.net/World.tsv fetch (Workers fetch API)
 * — UA 헤더 필수 (eloratings.net이 기본 fetch 차단함)
 */
async function fetchEloTsv() {
  const resp = await fetch('https://eloratings.net/World.tsv', {
    headers: { 'User-Agent': 'Mozilla/5.0 (GroupStages/1.0)' },
  });
  if (!resp.ok) {
    throw new Error(`eloratings.net HTTP ${resp.status}`);
  }
  return await resp.text();
}

/**
 * TSV 텍스트 → { data: { TEAM_ID: { elo, eloCode, rank } }, unmapped: [] }
 * (server/services/eloService.js:154-191 의 순수 파싱 부분만 발췌)
 */
export function parseEloTsv(tsvText) {
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

  return { data, unmapped };
}

/**
 * 메인 ELO sync 오케스트레이터 — cron + 수동 트리거 양쪽에서 호출
 * @returns {{ success, mapped, unmapped, duration_ms, error? }}
 */
export async function syncElo(env) {
  const startTime = Date.now();

  try {
    // 1. TSV fetch
    const tsv = await fetchEloTsv();

    // 2. 파싱
    const { data, unmapped } = parseEloTsv(tsv);
    const teamIds = Object.keys(data);

    if (teamIds.length === 0) {
      throw new Error('파싱 결과 매핑된 팀이 0건');
    }

    // 3. D1 batch UPSERT
    const statements = teamIds.map((teamId) => {
      const { elo, eloCode, rank } = data[teamId];
      return env.DB.prepare(
        `INSERT INTO team_elo (team_id, elo, elo_code, elo_rank, updated_at)
         VALUES (?1, ?2, ?3, ?4, datetime('now'))
         ON CONFLICT(team_id) DO UPDATE SET
           elo        = ?2,
           elo_code   = ?3,
           elo_rank   = ?4,
           updated_at = datetime('now')`
      ).bind(teamId, elo, eloCode ?? null, rank ?? null);
    });

    await env.DB.batch(statements);

    const duration = Date.now() - startTime;
    console.log(`[ELO Sync] Done: ${teamIds.length} mapped, ${unmapped.length} unmapped (${duration}ms)`);

    // 4. sync log 기록
    await env.DB.prepare(
      `INSERT INTO api_sync_log (sync_type, status, teams_synced, sync_duration_ms)
       VALUES (?1, ?2, ?3, ?4)`
    ).bind('elo', 'success', teamIds.length, duration).run();

    return {
      success: true,
      mapped: teamIds.length,
      unmapped: unmapped.length,
      duration_ms: duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[ELO Sync] Failed: ${error.message}`);

    try {
      await env.DB.prepare(
        `INSERT INTO api_sync_log (sync_type, status, error_message, sync_duration_ms)
         VALUES (?1, ?2, ?3, ?4)`
      ).bind('elo', 'failed', error.message, duration).run();
    } catch (_) { /* ignore */ }

    return { success: false, error: error.message, duration_ms: duration };
  }
}
