/**
 * Cloudflare Workers — API-Football Sync
 * server/services/apiFootballService.js + server/routes/syncRoutes.js 포팅
 */

const API_BASE = 'https://v3.football.api-sports.io';

/**
 * API-Football 호출 (axios → fetch 포팅)
 */
async function fetchFixtures(env) {
  const url = new URL(`${API_BASE}/fixtures`);
  url.searchParams.set('league', env.WORLD_CUP_LEAGUE_ID);
  url.searchParams.set('season', env.WORLD_CUP_SEASON);

  const resp = await fetch(url.toString(), {
    headers: {
      'x-apisports-key': env.API_FOOTBALL_KEY,
    },
  });

  if (!resp.ok) {
    const remaining = resp.headers.get('x-ratelimit-requests-remaining');
    if (resp.status === 429) throw new Error(`Rate Limit exceeded (remaining: ${remaining})`);
    if (resp.status === 401) throw new Error('API auth failed — check API_FOOTBALL_KEY');
    throw new Error(`API-Football HTTP ${resp.status}`);
  }

  // Rate limit 로깅
  const remaining = resp.headers.get('x-ratelimit-requests-remaining');
  const limit = resp.headers.get('x-ratelimit-requests-limit');
  console.log(`[API-Football] Rate Limit: ${remaining}/${limit} remaining`);

  const data = await resp.json();
  return { fixtures: data.response, remaining: parseInt(remaining) || null };
}

/**
 * 조별리그 경기만 필터 (apiFootballService.js:171-175)
 */
function filterGroupStageFixtures(fixtures) {
  return fixtures.filter(f => f.league.round && f.league.round.includes('Group'));
}

/**
 * API fixture → DB 형식 변환 (apiFootballService.js:182-210)
 */
function convertFixtureToDbFormat(fixture, teamMapping) {
  const homeApiId = fixture.teams.home.id;
  const awayApiId = fixture.teams.away.id;

  const homeId = teamMapping[homeApiId];
  const awayId = teamMapping[awayApiId];

  if (!homeId || !awayId) return null;

  const matchdayMatch = fixture.league.round?.match(/(\d+)/);
  const matchday = matchdayMatch ? parseInt(matchdayMatch[1]) : null;

  return {
    fixture_id: fixture.fixture.id,
    home_id: homeId,
    away_id: awayId,
    home_score: fixture.goals.home,
    away_score: fixture.goals.away,
    matchday,
    match_date: fixture.fixture.date,
    status: fixture.fixture.status.short, // NS, FT, 1H, HT, 2H, etc.
  };
}

// ─── Card Events Sync ──────────────────────────────────────

const LIVE_STATUSES = ['1H', '2H', 'HT', 'ET', 'BT', 'P'];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 특정 경기의 이벤트 조회 (카드 추출용)
 */
async function fetchFixtureEvents(fixtureId, env) {
  const url = `${API_BASE}/fixtures/events?fixture=${fixtureId}`;
  const resp = await fetch(url, {
    headers: { 'x-apisports-key': env.API_FOOTBALL_KEY },
  });
  if (!resp.ok) {
    if (resp.status === 429) throw new Error('Rate Limit exceeded');
    throw new Error(`Events API HTTP ${resp.status}`);
  }
  const data = await resp.json();
  return data.response || [];
}

/**
 * 이벤트에서 카드 통계 추출 (apiFootballService.js:217-240 포팅)
 */
function extractCardStatistics(events) {
  const stats = {};
  for (const event of events) {
    if (event.type !== 'Card') continue;
    const teamId = String(event.team.id);
    if (!stats[teamId]) stats[teamId] = { yc: 0, twoYR: 0, dr: 0 };
    if (event.detail === 'Yellow Card') {
      stats[teamId].yc++;
    } else if (event.detail === 'Red Card') {
      const isTwoYellow = event.comments?.includes('Second Yellow') || false;
      if (isTwoYellow) stats[teamId].twoYR++;
      else stats[teamId].dr++;
    }
  }
  return stats;
}

/**
 * fixture_cards → team_statistics 재계산
 */
async function recalcTeamStatistics(env) {
  const { results: allCards } = await env.DB.prepare(
    'SELECT cards_json FROM fixture_cards'
  ).all();

  // 팀별 합산
  const totals = {}; // { apiTeamId: { yc, twoYR, dr } }
  for (const row of allCards) {
    const parsed = JSON.parse(row.cards_json);
    for (const [teamId, card] of Object.entries(parsed)) {
      if (!totals[teamId]) totals[teamId] = { yc: 0, twoYR: 0, dr: 0 };
      totals[teamId].yc += card.yc;
      totals[teamId].twoYR += card.twoYR;
      totals[teamId].dr += card.dr;
    }
  }

  // API team ID → 내부 team ID 매핑
  const { results: mappings } = await env.DB.prepare(
    'SELECT api_team_id, our_team_id FROM team_mapping'
  ).all();
  const apiToOur = {};
  for (const m of mappings) apiToOur[String(m.api_team_id)] = m.our_team_id;

  // 내부 team ID → group_key 매핑
  const { results: matches } = await env.DB.prepare(
    'SELECT DISTINCT home_id, group_key FROM match_results'
  ).all();
  const teamGroup = {};
  for (const m of matches) teamGroup[m.home_id] = m.group_key;

  // batch upsert
  const statements = [];
  for (const [apiTeamId, card] of Object.entries(totals)) {
    const ourId = apiToOur[apiTeamId];
    if (!ourId) continue;
    const groupKey = teamGroup[ourId];
    if (!groupKey) continue;
    const fp = card.yc * 1 + card.twoYR * 3 + card.dr * 4;
    statements.push(
      env.DB.prepare(
        `INSERT INTO team_statistics (team_id, group_key, yellow_cards, two_yellow_red, direct_red, fair_play_points, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, datetime('now'))
         ON CONFLICT (team_id, group_key) DO UPDATE SET
           yellow_cards = ?3, two_yellow_red = ?4, direct_red = ?5,
           fair_play_points = ?6, updated_at = datetime('now')`
      ).bind(ourId, groupKey, card.yc, card.twoYR, card.dr, fp)
    );
  }
  if (statements.length > 0) await env.DB.batch(statements);
  return statements.length;
}

/**
 * 1회 카드 이벤트 동기화 (진행 중 + 막 종료 경기만)
 */
async function syncCardEventsOnce(env) {
  // 진행 중인 경기
  const { results: liveMatches } = await env.DB.prepare(
    `SELECT fixture_id, home_id, away_id, status FROM match_results
     WHERE status IN ('1H', '2H', 'HT', 'ET', 'BT', 'P')
     AND fixture_id IS NOT NULL`
  ).all();

  // 막 종료된 경기 (FT인데 fixture_cards에 is_final=0 이거나 없는 것)
  const { results: justFinished } = await env.DB.prepare(
    `SELECT m.fixture_id, m.home_id, m.away_id FROM match_results m
     LEFT JOIN fixture_cards fc ON m.fixture_id = fc.fixture_id
     WHERE m.status = 'FT' AND m.fixture_id IS NOT NULL
     AND (fc.fixture_id IS NULL OR fc.is_final = 0)`
  ).all();

  const targets = [...liveMatches, ...justFinished];
  if (targets.length === 0) return { fetched: 0, skipped: true };

  let fetched = 0;
  const cardStatements = [];

  for (const match of targets) {
    const events = await fetchFixtureEvents(match.fixture_id, env);
    const cards = extractCardStatistics(events);
    const isFinal = match.status === 'FT' ? 1 : 0;

    cardStatements.push(
      env.DB.prepare(
        `INSERT INTO fixture_cards (fixture_id, home_id, away_id, cards_json, is_final, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'))
         ON CONFLICT (fixture_id) DO UPDATE SET
           cards_json = ?4, is_final = ?5, updated_at = datetime('now')`
      ).bind(match.fixture_id, match.home_id, match.away_id, JSON.stringify(cards), isFinal)
    );
    fetched++;
  }

  if (cardStatements.length > 0) await env.DB.batch(cardStatements);

  // team_statistics 재계산
  const teamsUpdated = await recalcTeamStatistics(env);

  return { fetched, teamsUpdated };
}

/**
 * 카드 이벤트 cron 핸들러 — 1분 cron, 내부 3회 호출 (20초 간격)
 */
export async function syncCardEvents(env) {
  const startTime = Date.now();
  const log = { sync_type: 'card_events', status: 'success', fixtures_synced: 0, error_message: null };

  try {
    let totalFetched = 0;

    for (let i = 0; i < 3; i++) {
      const result = await syncCardEventsOnce(env);
      if (result.skipped) {
        console.log(`[Cards] Pass ${i + 1}/3: no live matches, skipping`);
        break; // 진행 중 경기 없으면 나머지 패스도 스킵
      }
      totalFetched += result.fetched;
      console.log(`[Cards] Pass ${i + 1}/3: ${result.fetched} fixtures, ${result.teamsUpdated} teams`);
      if (i < 2) await sleep(20000);
    }

    log.fixtures_synced = totalFetched;
    const duration = Date.now() - startTime;

    if (totalFetched > 0) {
      await env.DB.prepare(
        `INSERT INTO api_sync_log (sync_type, status, fixtures_synced, sync_duration_ms)
         VALUES (?1, ?2, ?3, ?4)`
      ).bind(log.sync_type, log.status, log.fixtures_synced, duration).run();
    }

    return { success: true, fetched: totalFetched, duration_ms: duration };

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Cards] Failed: ${error.message}`);
    try {
      await env.DB.prepare(
        `INSERT INTO api_sync_log (sync_type, status, fixtures_synced, error_message, sync_duration_ms)
         VALUES (?1, ?2, ?3, ?4, ?5)`
      ).bind('card_events', 'failed', log.fixtures_synced, error.message, duration).run();
    } catch (_) { /* ignore */ }
    return { success: false, error: error.message, duration_ms: duration };
  }
}

// ─── Fixtures Sync ─────────────────────────────────────────

/**
 * 메인 오케스트레이터 — syncRoutes.js POST /fixtures 포팅
 * @returns {{ success, synced, skipped, duration_ms, error? }}
 */
export async function syncFixturesToD1(env) {
  const startTime = Date.now();
  const log = { sync_type: 'fixtures', status: 'success', fixtures_synced: 0, error_message: null };

  try {
    // 1. team_mapping 로드
    const { results: mappings } = await env.DB.prepare(
      'SELECT api_team_id, our_team_id FROM team_mapping'
    ).all();

    if (!mappings || mappings.length === 0) {
      throw new Error('team_mapping 테이블이 비어있습니다. D1에 매핑 데이터를 먼저 insert하세요.');
    }

    const teamMapping = {};
    for (const m of mappings) {
      teamMapping[m.api_team_id] = m.our_team_id;
    }

    // 2. API-Football에서 경기 데이터 fetch
    const { fixtures, remaining } = await fetchFixtures(env);
    const groupFixtures = filterGroupStageFixtures(fixtures);

    console.log(`[Sync] ${groupFixtures.length}/${fixtures.length} group stage fixtures`);

    // 3. 기존 match_results 전체 로드 (batch 매칭용)
    const { results: existingMatches } = await env.DB.prepare(
      'SELECT id, group_key, home_id, away_id FROM match_results'
    ).all();

    // home_id+away_id → match record 양방향 인덱스
    const matchIndex = {};
    for (const m of existingMatches) {
      matchIndex[`${m.home_id}:${m.away_id}`] = m;
      matchIndex[`${m.away_id}:${m.home_id}`] = m;
    }

    // 4. UPDATE 문 배치 준비
    const statements = [];
    let synced = 0;
    let skipped = 0;

    for (const fixture of groupFixtures) {
      const converted = convertFixtureToDbFormat(fixture, teamMapping);
      if (!converted) { skipped++; continue; }

      // 양방향 매칭
      const match = matchIndex[`${converted.home_id}:${converted.away_id}`];
      if (!match) { skipped++; continue; }

      // DB의 home/away 순서에 맞게 점수 할당
      const isSwapped = match.home_id !== converted.home_id;
      const homeScore = isSwapped ? converted.away_score : converted.home_score;
      const awayScore = isSwapped ? converted.home_score : converted.away_score;

      statements.push(
        env.DB.prepare(
          `UPDATE match_results
           SET home_score = ?1, away_score = ?2, status = ?3,
               fixture_id = COALESCE(?4, fixture_id),
               matchday = COALESCE(?5, matchday),
               match_date = COALESCE(?6, match_date),
               updated_at = datetime('now')
           WHERE id = ?7`
        ).bind(
          homeScore, awayScore, converted.status,
          converted.fixture_id, converted.matchday,
          converted.match_date, match.id
        )
      );
      synced++;
    }

    // 5. 배치 실행
    if (statements.length > 0) {
      await env.DB.batch(statements);
    }

    log.fixtures_synced = synced;
    const duration = Date.now() - startTime;

    console.log(`[Sync] Done: ${synced} updated, ${skipped} skipped (${duration}ms)`);

    // 6. sync log 기록
    await env.DB.prepare(
      `INSERT INTO api_sync_log (sync_type, status, fixtures_synced, sync_duration_ms)
       VALUES (?1, ?2, ?3, ?4)`
    ).bind(log.sync_type, log.status, log.fixtures_synced, duration).run();

    return { success: true, synced, skipped, duration_ms: duration, api_remaining: remaining };

  } catch (error) {
    const duration = Date.now() - startTime;
    log.status = 'failed';
    log.error_message = error.message;

    console.error(`[Sync] Failed: ${error.message}`);

    // 에러 로그 기록 (이것도 실패하면 무시)
    try {
      await env.DB.prepare(
        `INSERT INTO api_sync_log (sync_type, status, fixtures_synced, error_message, sync_duration_ms)
         VALUES (?1, ?2, ?3, ?4, ?5)`
      ).bind(log.sync_type, log.status, log.fixtures_synced, log.error_message, duration).run();
    } catch (_) { /* ignore */ }

    return { success: false, error: error.message, duration_ms: duration };
  }
}
