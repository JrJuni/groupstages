import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.RAPIDAPI_KEY;
const apiHost = process.env.RAPIDAPI_HOST;

console.log('API-Football 연결 테스트 시작...\n');

// 1. World Cup 리그 찾기
async function findWorldCupLeague() {
  try {
    console.log('1. World Cup 리그 검색 중...');
    const response = await axios.get('https://v3.football.api-sports.io/leagues', {
      headers: {
        'x-rapidapi-host': apiHost,
        'x-rapidapi-key': apiKey
      },
      params: {
        name: 'World Cup',
        season: 2026
      }
    });

    console.log('✅ API 연결 성공!');
    console.log(`Rate Limit: ${response.headers['x-ratelimit-requests-remaining']}/${response.headers['x-ratelimit-requests-limit']} remaining\n`);

    if (response.data.response && response.data.response.length > 0) {
      console.log('📋 2026 World Cup 정보:');
      response.data.response.forEach(league => {
        console.log(`- League ID: ${league.league.id}`);
        console.log(`- League Name: ${league.league.name}`);
        console.log(`- Country: ${league.country.name}`);
        console.log(`- Season: ${league.seasons?.[0]?.year || 'N/A'}`);
        console.log('');
      });
      return response.data.response[0]?.league?.id;
    } else {
      console.log('⚠️  2026 World Cup 리그를 찾을 수 없습니다.');
      console.log('대신 일반 World Cup 리그 검색 시도...\n');

      // Season 파라미터 없이 재시도
      const response2 = await axios.get('https://v3.football.api-sports.io/leagues', {
        headers: {
          'x-rapidapi-host': apiHost,
          'x-rapidapi-key': apiKey
        },
        params: {
          name: 'World Cup'
        }
      });

      console.log('📋 사용 가능한 World Cup 리그:');
      response2.data.response.forEach(league => {
        console.log(`- League ID: ${league.league.id}, Name: ${league.league.name}, Country: ${league.country.name}`);
      });

      return response2.data.response.find(l => l.league.name === 'World Cup')?.league?.id || 1;
    }
  } catch (error) {
    console.error('❌ API 호출 실패:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.error('인증 실패: API 키를 확인해주세요.');
    } else if (error.response?.status === 429) {
      console.error('Rate Limit 초과: 잠시 후 다시 시도해주세요.');
    }
    throw error;
  }
}

// 2. 리그의 팀 목록 가져오기
async function getLeagueTeams(leagueId) {
  try {
    console.log(`\n2. League ${leagueId}의 팀 정보 조회 중...`);
    const response = await axios.get('https://v3.football.api-sports.io/teams', {
      headers: {
        'x-rapidapi-host': apiHost,
        'x-rapidapi-key': apiKey
      },
      params: {
        league: leagueId,
        season: 2026
      }
    });

    if (response.data.response && response.data.response.length > 0) {
      console.log(`✅ ${response.data.response.length}개 팀 발견\n`);
      console.log('📋 팀 목록 (처음 10개):');
      response.data.response.slice(0, 10).forEach(item => {
        console.log(`- ID: ${item.team.id}, Name: ${item.team.name}, Code: ${item.team.code || 'N/A'}`);
      });
    } else {
      console.log('⚠️  팀 정보를 찾을 수 없습니다.');
    }

    return response.data.response;
  } catch (error) {
    console.error('❌ 팀 정보 조회 실패:', error.response?.data || error.message);
    return [];
  }
}

// 3. 리그의 경기 일정 가져오기
async function getLeagueFixtures(leagueId) {
  try {
    console.log(`\n3. League ${leagueId}의 경기 일정 조회 중...`);
    const response = await axios.get('https://v3.football.api-sports.io/fixtures', {
      headers: {
        'x-rapidapi-host': apiHost,
        'x-rapidapi-key': apiKey
      },
      params: {
        league: leagueId,
        season: 2026
      }
    });

    if (response.data.response && response.data.response.length > 0) {
      console.log(`✅ ${response.data.response.length}개 경기 발견\n`);
      console.log('📋 경기 일정 (처음 5개):');
      response.data.response.slice(0, 5).forEach(fixture => {
        console.log(`- Fixture ID: ${fixture.fixture.id}`);
        console.log(`  ${fixture.teams.home.name} vs ${fixture.teams.away.name}`);
        console.log(`  Date: ${fixture.fixture.date}`);
        console.log(`  Status: ${fixture.fixture.status.short}`);
        console.log(`  Venue: ${fixture.fixture.venue?.name || 'TBD'}`);
        console.log('');
      });
    } else {
      console.log('⚠️  경기 일정을 찾을 수 없습니다.');
      console.log('💡 2026 World Cup 데이터가 아직 API에 추가되지 않았을 수 있습니다.');
    }

    return response.data.response;
  } catch (error) {
    console.error('❌ 경기 일정 조회 실패:', error.response?.data || error.message);
    return [];
  }
}

// 메인 실행
async function main() {
  try {
    const leagueId = await findWorldCupLeague();

    if (leagueId) {
      await getLeagueTeams(leagueId);
      await getLeagueFixtures(leagueId);

      console.log('\n' + '='.repeat(60));
      console.log('✅ 테스트 완료!');
      console.log(`📝 .env 파일에 WORLD_CUP_LEAGUE_ID=${leagueId} 설정을 확인하세요.`);
      console.log('='.repeat(60));
    }
  } catch (error) {
    console.error('\n테스트 실패:', error.message);
    process.exit(1);
  }
}

main();
