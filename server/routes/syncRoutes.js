import express from 'express';
import apiFootballService from '../services/apiFootballService.js';
import cacheService from '../services/cacheService.js';

export function createSyncRoutes(pool) {
  const router = express.Router();

  /**
   * POST /api/sync/fixtures
   * API-Football에서 경기 일정 및 결과를 가져와 DB에 동기화
   */
  router.post('/fixtures', async (req, res) => {
    const startTime = Date.now();
    const log = {
      sync_type: 'fixtures',
      status: 'success',
      fixtures_synced: 0,
      teams_synced: 0,
      error_message: null
    };

    try {
      console.log('\n[Sync] 경기 데이터 동기화 시작...');

      // 1. team_mapping 테이블에서 API ID → 우리 ID 매핑 가져오기
      const { rows: mappings } = await pool.query(
        'SELECT api_team_id, our_team_id FROM team_mapping'
      );

      const teamMapping = {};
      mappings.forEach(m => {
        teamMapping[m.api_team_id] = m.our_team_id;
      });

      console.log(`✅ ${mappings.length}개 팀 매핑 로드`);

      // 2. API-Football에서 모든 경기 가져오기
      const fixtures = await apiFootballService.getAllFixtures();
      const groupStageFixtures = apiFootballService.filterGroupStageFixtures(fixtures);

      console.log(`📋 조별리그 경기: ${groupStageFixtures.length}/${fixtures.length}개`);

      // 3. 각 경기를 DB에 upsert
      let synced = 0;
      let skipped = 0;

      for (const fixture of groupStageFixtures) {
        const converted = apiFootballService.convertFixtureToDbFormat(fixture, teamMapping);

        if (!converted) {
          skipped++;
          continue;
        }

        // group_key는 우리 데이터에서 찾아야 함
        // 양방향 매칭: (A vs B) 또는 (B vs A) 모두 찾기
        const { rows: existing } = await pool.query(
          `SELECT id, group_key, home_id, away_id FROM match_results
           WHERE (home_id = $1 AND away_id = $2) OR (home_id = $2 AND away_id = $1)
           LIMIT 1`,
          [converted.home_id, converted.away_id]
        );

        if (existing.length === 0) {
          console.warn(`⚠️  ${converted.home_id} vs ${converted.away_id}: DB에 경기 레코드가 없습니다. 스킵합니다.`);
          skipped++;
          continue;
        }

        const matchRecord = existing[0];
        const groupKey = matchRecord.group_key;
        const dbMatchId = matchRecord.id; // DB에 저장된 실제 ID 사용

        // Upsert - DB에 저장된 ID 사용 (홈/어웨이 순서 유지)
        await pool.query(
          `UPDATE match_results
           SET home_score = $1,
               away_score = $2,
               status = $3,
               fixture_id = COALESCE($4, fixture_id),
               matchday = COALESCE($5, matchday),
               match_date = COALESCE($6, match_date),
               updated_at = NOW()
           WHERE id = $7`,
          [
            converted.home_score,
            converted.away_score,
            converted.status,
            converted.fixture_id,
            converted.matchday,
            converted.match_date,
            dbMatchId
          ]
        );

        synced++;
      }

      log.fixtures_synced = synced;
      log.status = 'success';

      const duration = Date.now() - startTime;
      console.log(`✅ 동기화 완료: ${synced}개 경기 업데이트, ${skipped}개 스킵 (${duration}ms)`);

      // 로그 저장
      await pool.query(
        `INSERT INTO api_sync_log (sync_type, status, fixtures_synced, sync_duration_ms)
         VALUES ($1, $2, $3, $4)`,
        [log.sync_type, log.status, log.fixtures_synced, duration]
      );

      res.json({
        success: true,
        synced: synced,
        skipped: skipped,
        duration_ms: duration
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      log.status = 'failed';
      log.error_message = error.message;

      console.error('❌ 동기화 실패:', error.message);

      // 에러 로그 저장
      await pool.query(
        `INSERT INTO api_sync_log (sync_type, status, fixtures_synced, error_message, sync_duration_ms)
         VALUES ($1, $2, $3, $4, $5)`,
        [log.sync_type, log.status, log.fixtures_synced, log.error_message, duration]
      ).catch(err => console.error('로그 저장 실패:', err));

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /api/sync/card-statistics/:fixtureId
   * 특정 경기의 카드 통계를 가져와 team_statistics 테이블에 업데이트
   */
  router.post('/card-statistics/:fixtureId', async (req, res) => {
    const { fixtureId } = req.params;

    try {
      console.log(`\n[Sync] Fixture ${fixtureId} 카드 통계 동기화 시작...`);

      // 1. API에서 경기 이벤트 가져오기
      const events = await apiFootballService.getFixtureEvents(fixtureId);
      const cardStats = apiFootballService.extractCardStatistics(events);

      console.log(`📊 카드 통계:`, cardStats);

      // 2. team_mapping으로 API team ID → 우리 team ID 변환
      const { rows: mappings } = await pool.query(
        'SELECT api_team_id, our_team_id FROM team_mapping'
      );

      const teamMapping = {};
      mappings.forEach(m => {
        teamMapping[m.api_team_id] = m.our_team_id;
      });

      // 3. 각 팀의 카드 통계를 team_statistics에 업데이트
      let updated = 0;

      for (const [apiTeamId, stats] of Object.entries(cardStats)) {
        const ourTeamId = teamMapping[apiTeamId];

        if (!ourTeamId) {
          console.warn(`⚠️  API Team ID ${apiTeamId}를 매핑할 수 없습니다.`);
          continue;
        }

        // 팀의 group_key 찾기
        const { rows: teamInfo } = await pool.query(
          'SELECT DISTINCT group_key FROM match_results WHERE home_id = $1 OR away_id = $1 LIMIT 1',
          [ourTeamId]
        );

        if (teamInfo.length === 0) {
          console.warn(`⚠️  팀 ${ourTeamId}의 group_key를 찾을 수 없습니다.`);
          continue;
        }

        const groupKey = teamInfo[0].group_key;

        // Fair play points 계산: YC=1, 2YR=3, DR=4
        const fairPlayPoints = stats.yellowCards * 1 + stats.twoYellowRed * 3 + stats.red * 4;

        await pool.query(
          `INSERT INTO team_statistics (team_id, group_key, yellow_cards, two_yellow_red, direct_red, fair_play_points, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())
           ON CONFLICT (team_id, group_key) DO UPDATE
             SET yellow_cards = team_statistics.yellow_cards + EXCLUDED.yellow_cards,
                 two_yellow_red = team_statistics.two_yellow_red + EXCLUDED.two_yellow_red,
                 direct_red = team_statistics.direct_red + EXCLUDED.direct_red,
                 fair_play_points = team_statistics.fair_play_points + EXCLUDED.fair_play_points,
                 updated_at = NOW()`,
          [ourTeamId, groupKey, stats.yellowCards, stats.twoYellowRed, stats.red, fairPlayPoints]
        );

        updated++;
      }

      console.log(`✅ ${updated}개 팀 카드 통계 업데이트 완료`);

      res.json({
        success: true,
        updated: updated,
        card_stats: cardStats
      });

    } catch (error) {
      console.error('❌ 카드 통계 동기화 실패:', error.message);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/sync/status
   * API-Football Rate Limit 및 동기화 이력 확인
   */
  router.get('/status', async (req, res) => {
    try {
      // 1. Rate Limit 체크
      const rateLimit = await apiFootballService.checkRateLimit();

      // 2. 최근 동기화 이력 조회
      const { rows: recentLogs } = await pool.query(
        'SELECT * FROM api_sync_log ORDER BY synced_at DESC LIMIT 10'
      );

      // 3. 마지막 성공 동기화 시간
      const { rows: lastSuccess } = await pool.query(
        `SELECT synced_at FROM api_sync_log
         WHERE status = 'success' AND sync_type = 'fixtures'
         ORDER BY synced_at DESC LIMIT 1`
      );

      res.json({
        rate_limit: rateLimit,
        last_sync: lastSuccess.length > 0 ? lastSuccess[0].synced_at : null,
        recent_logs: recentLogs
      });

    } catch (error) {
      console.error('❌ 상태 조회 실패:', error.message);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  return router;
}
