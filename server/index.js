import express from 'express';
import pg from 'pg';
import cors from 'cors';
import { createSyncRoutes } from './routes/syncRoutes.js';
import {
  getEloCached,
  getCacheStatus,
  refreshElo,
  refreshIfStale as refreshEloIfStale,
} from './services/eloService.js';
import {
  getCacheStatus as getFormCacheStatus,
  refreshAll as refreshAllForm,
  refreshIfStale as refreshFormIfStale,
} from './services/teamFormService.js';
import apiFootballService from './services/apiFootballService.js';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
});

const app = express();
app.use(cors());
app.use(express.json());

// API-Football 동기화 라우트
app.use('/api/sync', createSyncRoutes(pool));

// ── Phase 3.5: 캐시 자동 갱신 closures ─────────────────────
// pool / apiFootballService 를 캡처한 단일 refreshFn — GET handler / POST handler / startup hook 에서 공유
async function refreshFormFromDb() {
  const { rows: mappings } = await pool.query(
    'SELECT api_team_id, our_team_id FROM team_mapping'
  );
  const teamMapping = {};
  mappings.forEach((m) => { teamMapping[m.our_team_id] = m.api_team_id; });
  return refreshAllForm({
    teamMapping,
    fetchLastN: (apiTeamId, n) => apiFootballService.getLastNFixtures(apiTeamId, n),
  });
}

// stale 임계값 (24h) — Phase 5 (Workers cron 6시간 간격) 전까지 dev 갭 메우기
const STALE_MAX_HOURS = 24;

// GET /api/elo - ELO 캐시 데이터 반환 (API 호출 없음, 캐시 파일만 읽음)
// Phase 3.5: stale 캐시는 백그라운드 자동 갱신 트리거 후 stale 즉시 반환
// 응답: { data: { "KOR": { elo, apiTeamId, teamName }, ... }, fetchedAt, expired, ageHours }
app.get('/api/elo', async (req, res) => {
  // 백그라운드 stale 갱신 (응답 블로킹 X)
  refreshEloIfStale({ maxAgeHours: STALE_MAX_HOURS, refreshFn: refreshElo }).catch(() => {});

  try {
    const status = await getCacheStatus();
    if (!status.cache) {
      return res.status(404).json({
        success: false,
        error: 'ELO 캐시 없음. POST /api/sync/elo 로 먼저 fetch 하세요.',
      });
    }
    res.json({
      success: true,
      data: status.cache.data,
      fetchedAt: status.cache.fetchedAt,
      ageHours: status.ageSeconds != null ? +(status.ageSeconds / 3600).toFixed(1) : null,
      todayFetchCount: status.todayCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/team-form - 폼 캐시 데이터 반환 (API 호출 없음, 캐시 파일만 읽음)
// Phase 3.5: stale 캐시는 백그라운드 자동 갱신 트리거 후 stale 즉시 반환
// 응답: { data: { TEAM_ID: { n, gfPerGame, gaPerGame, lastUpdated } }, fetchedAt, ageHours }
app.get('/api/team-form', async (req, res) => {
  // 백그라운드 stale 갱신 (응답 블로킹 X)
  refreshFormIfStale({ maxAgeHours: STALE_MAX_HOURS, refreshFn: refreshFormFromDb }).catch(() => {});

  try {
    const status = await getFormCacheStatus();
    if (!status.cache) {
      return res.status(404).json({
        success: false,
        error: '폼 캐시 없음. POST /api/team-form/refresh 로 먼저 fetch 하세요.',
      });
    }
    res.json({
      success: true,
      data: status.cache.data,
      fetchedAt: status.cache.fetchedAt,
      ageHours: status.ageSeconds != null ? +(status.ageSeconds / 3600).toFixed(1) : null,
      todayFetchCount: status.todayCount,
      lastN: status.cache.lastN ?? null,
      skipped: status.cache.skipped ?? [],
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/team-form/refresh - team_mapping 기반 48팀 폼 새로고침
// Query: ?force=true → 일일 10회 제한 우회
app.post('/api/team-form/refresh', async (req, res) => {
  const force = req.query.force === 'true';

  try {
    const status = await getFormCacheStatus();
    if (!force && !status.canFetchToday) {
      return res.json({
        success: true,
        source: 'cache',
        reason: `오늘 최대 refresh 횟수(10회) 초과 (${status.todayCount}회 완료)`,
        todayFetchCount: status.todayCount,
        fetchedAt: status.cache?.fetchedAt ?? null,
        teams: Object.keys(status.cache?.data ?? {}).length,
      });
    }

    // 단일 소스 (refreshFormFromDb) 사용 — Phase 3.5 DRY 통합
    const saved = await refreshFormFromDb();

    res.json({
      success: true,
      source: 'api-football',
      todayFetchCount: saved.todayFetchCount,
      fetchedAt: saved.fetchedAt,
      teams: Object.keys(saved.data).length,
      skipped: saved.skipped.length,
      skippedDetails: saved.skipped.slice(0, 20),
    });
  } catch (error) {
    console.error('[Form] refresh 실패:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/matches - 모든 경기 결과 조회
// API-Football 호환 컬럼: fixture_id (fixture.id), match_date (fixture.date),
//   status (fixture.status.short: NS/1H/HT/2H/FT), matchday (league.round 숫자)
app.get('/api/matches', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, group_key, home_id, away_id, home_score, away_score,
              matchday, match_date, status, fixture_id
       FROM match_results
       ORDER BY match_date ASC NULLS LAST, group_key, id`
    );
    res.json(rows);
  } catch (err) {
    console.error('[GET /api/matches]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/matches - 경기 결과 저장 (upsert)
// API-Football 연동 시 fixture_id, match_date, status도 함께 저장 가능
app.post('/api/matches', async (req, res) => {
  const { id, group_key, home_id, away_id, home_score, away_score,
          matchday, match_date, status, fixture_id } = req.body;
  if (!id || !group_key || !home_id || !away_id) {
    return res.status(400).json({ error: 'id, group_key, home_id, away_id 필수' });
  }
  try {
    await pool.query(
      `INSERT INTO match_results
         (id, group_key, home_id, away_id, home_score, away_score,
          matchday, match_date, status, fixture_id, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       ON CONFLICT (id) DO UPDATE
         SET home_score  = EXCLUDED.home_score,
             away_score  = EXCLUDED.away_score,
             matchday    = COALESCE(EXCLUDED.matchday,    match_results.matchday),
             match_date  = COALESCE(EXCLUDED.match_date,  match_results.match_date),
             status      = COALESCE(EXCLUDED.status,      match_results.status),
             fixture_id  = COALESCE(EXCLUDED.fixture_id,  match_results.fixture_id),
             updated_at  = NOW()`,
      [id, group_key, home_id, away_id,
        home_score !== '' && home_score !== null && home_score !== undefined ? parseInt(home_score) : null,
        away_score !== '' && away_score !== null && away_score !== undefined ? parseInt(away_score) : null,
        matchday ?? null,
        match_date ?? null,
        status ?? 'NS',
        fixture_id ?? null]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('[POST /api/matches]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/matches/:id - 경기 결과 초기화
app.delete('/api/matches/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM match_results WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/matches - 전체 초기화
app.delete('/api/matches', async (req, res) => {
  try {
    await pool.query('DELETE FROM match_results');
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/third-place - DB에서 직접 3위팀 계산 쿼리
app.get('/api/third-place', async (req, res) => {
  try {
    const { rows: matches } = await pool.query(
      `SELECT group_key, home_id, away_id, home_score, away_score
       FROM match_results
       WHERE home_score IS NOT NULL AND away_score IS NOT NULL`
    );

    // 그룹별로 집계
    const groupStats = {};
    for (const m of matches) {
      const g = m.group_key;
      if (!groupStats[g]) groupStats[g] = {};
      const hs = parseInt(m.home_score);
      const as_ = parseInt(m.away_score);
      const addStats = (id, gf, ga, win, draw, lose) => {
        if (!groupStats[g][id]) groupStats[g][id] = { id, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0 };
        const s = groupStats[g][id];
        s.played++; s.gf += gf; s.ga += ga;
        if (win) s.won++; else if (draw) s.drawn++; else s.lost++;
      };
      const homeWin = hs > as_, draw = hs === as_;
      addStats(m.home_id, hs, as_, homeWin, draw, !homeWin && !draw);
      addStats(m.away_id, as_, hs, !homeWin && !draw, draw, homeWin);
    }

    // 각 그룹에서 3위팀 추출
    const thirds = [];
    for (const [group, teams] of Object.entries(groupStats)) {
      const arr = Object.values(teams).map((t) => ({
        ...t,
        gd: t.gf - t.ga,
        pts: t.won * 3 + t.drawn,
        group,
      }));
      arr.sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.gd !== a.gd) return b.gd - a.gd;
        return b.gf - a.gf;
      });
      if (arr.length >= 3) thirds.push(arr[2]);
    }

    // 3위팀 전체 정렬
    thirds.sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      return b.gf - a.gf;
    });

    res.json(thirds);
  } catch (err) {
    console.error('[GET /api/third-place]', err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.API_PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API server running on port ${PORT}`);

  // Phase 3.5: 시작 시 stale 캐시 즉시 1회 갱신 (fire-and-forget)
  // 캐시 없거나 24h 초과면 백그라운드 fetch — 첫 요청자가 stale 데이터를 받지 않도록 미리 갱신
  refreshEloIfStale({ maxAgeHours: STALE_MAX_HOURS, refreshFn: refreshElo }).catch(() => {});
  refreshFormIfStale({ maxAgeHours: STALE_MAX_HOURS, refreshFn: refreshFormFromDb }).catch(() => {});
});
