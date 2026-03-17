import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

async function testDatabaseConnection() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('sslmode=disable') ? false : { rejectUnauthorized: false },
  });

  try {
    console.log('데이터베이스 연결 테스트 시작...\n');
    console.log('연결 문자열:', process.env.DATABASE_URL.replace(/password=[^@&]+/, 'password=***'));

    // 1. 연결 테스트
    const client = await pool.connect();
    console.log('✅ 데이터베이스 연결 성공!\n');

    // 2. 버전 확인
    const versionResult = await client.query('SELECT version()');
    console.log('PostgreSQL 버전:');
    console.log(versionResult.rows[0].version);
    console.log('');

    // 3. 현재 데이터베이스 확인
    const dbResult = await client.query('SELECT current_database()');
    console.log(`현재 데이터베이스: ${dbResult.rows[0].current_database}`);
    console.log('');

    // 4. 기존 테이블 확인
    const tablesResult = await client.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    console.log('기존 테이블 목록:');
    if (tablesResult.rows.length === 0) {
      console.log('  (테이블 없음)');
    } else {
      tablesResult.rows.forEach(row => {
        console.log(`  - ${row.tablename}`);
      });
    }
    console.log('');

    // 5. match_results 테이블 확인
    const matchTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'match_results'
      )
    `);

    if (matchTableCheck.rows[0].exists) {
      console.log('✅ match_results 테이블이 존재합니다.');

      const countResult = await client.query('SELECT COUNT(*) FROM match_results');
      console.log(`   레코드 수: ${countResult.rows[0].count}개`);
    } else {
      console.log('⚠️  match_results 테이블이 없습니다. 스키마를 먼저 생성해야 합니다.');
    }
    console.log('');

    // 6. team_mapping 테이블 확인
    const teamMappingCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'team_mapping'
      )
    `);

    if (teamMappingCheck.rows[0].exists) {
      console.log('✅ team_mapping 테이블이 존재합니다.');

      const countResult = await client.query('SELECT COUNT(*) FROM team_mapping');
      console.log(`   레코드 수: ${countResult.rows[0].count}개`);
    } else {
      console.log('⚠️  team_mapping 테이블이 없습니다.');
    }
    console.log('');

    // 7. team_statistics 테이블 확인
    const teamStatsCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'team_statistics'
      )
    `);

    if (teamStatsCheck.rows[0].exists) {
      console.log('✅ team_statistics 테이블이 존재합니다.');

      const countResult = await client.query('SELECT COUNT(*) FROM team_statistics');
      console.log(`   레코드 수: ${countResult.rows[0].count}개`);
    } else {
      console.log('⚠️  team_statistics 테이블이 없습니다.');
    }
    console.log('');

    client.release();
    await pool.end();

    console.log('='.repeat(60));
    console.log('테스트 완료!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ 데이터베이스 연결 실패:', error.message);
    console.error('상세 오류:', error);
    process.exit(1);
  }
}

testDatabaseConnection();
