import pg from 'pg';
import dotenv from 'dotenv';
import { INITIAL_GROUPS, MATCH_SCHEDULE } from '../src/data/worldcup2026.js';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('sslmode=disable') ? false : { rejectUnauthorized: false },
});

// MATCH_SCHEDULE에서 group_key 추론
function inferGroupKey(matchId) {
  for (const [groupKey, groupData] of Object.entries(INITIAL_GROUPS)) {
    const teamIds = groupData.teams.map(t => t.id);
    const [home, away] = matchId.split('_vs_');
    if (teamIds.includes(home) && teamIds.includes(away)) {
      return groupKey;
    }
  }
  return null;
}

async function seedMatches() {
  try {
    console.log('경기 일정 데이터를 DB에 삽입합니다...\n');

    let inserted = 0;
    let skipped = 0;

    for (const [matchId, scheduleInfo] of Object.entries(MATCH_SCHEDULE)) {
      const [home, away] = matchId.split('_vs_');
      const groupKey = inferGroupKey(matchId);

      if (!groupKey) {
        console.warn(`⚠️  ${matchId}: group_key를 찾을 수 없습니다.`);
        skipped++;
        continue;
      }

      await pool.query(
        `INSERT INTO match_results
           (id, group_key, home_id, away_id, home_score, away_score,
            matchday, match_date, status, fixture_id, updated_at)
         VALUES ($1, $2, $3, $4, NULL, NULL, $5, $6, 'NS', NULL, NOW())
         ON CONFLICT (id) DO NOTHING`,
        [matchId, groupKey, home, away, scheduleInfo.matchday, scheduleInfo.date]
      );

      inserted++;
      console.log(`✅ ${matchId} (Group ${groupKey}, Matchday ${scheduleInfo.matchday})`);
    }

    console.log(`\n총 ${inserted}개 경기 일정 삽입 완료 (${skipped}개 스킵)`);

    // 확인
    const { rows } = await pool.query('SELECT COUNT(*) FROM match_results');
    console.log(`\nDB에 총 ${rows[0].count}개 경기 레코드 존재`);

    await pool.end();
  } catch (error) {
    console.error('❌ 경기 일정 삽입 실패:', error.message);
    process.exit(1);
  }
}

seedMatches();
