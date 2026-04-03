import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.RAPIDAPI_KEY;
const apiHost = process.env.RAPIDAPI_HOST;

// 우리 팀 ID와 API에서의 팀 이름 매핑
const TEAM_NAME_MAPPING = {
  // Group A
  'MEX': 'Mexico',
  'KOR': ['Korea Republic', 'South Korea'],
  'RSA': 'South Africa',
  'CZE': ['Czech Republic', 'Czechia'],

  // Group B
  'CAN': 'Canada',
  'CHE': 'Switzerland',
  'QAT': 'Qatar',
  'BIH': ['Bosnia and Herzegovina', 'Bosnia'],

  // Group C
  'BRA': 'Brazil',
  'MAR': 'Morocco',
  'SCO': 'Scotland',
  'HTI': 'Haiti',

  // Group D
  'USA': ['USA', 'United States'],
  'AUS': 'Australia',
  'PAR': 'Paraguay',
  'TUR': ['Turkey', 'Türkiye'],

  // Group E
  'GER': 'Germany',
  'ECU': 'Ecuador',
  'CIV': ['Ivory Coast', 'Cote d\'Ivoire'],
  'CUW': 'Curacao',

  // Group F
  'NED': 'Netherlands',
  'JPN': 'Japan',
  'TUN': 'Tunisia',
  'SWE': 'Sweden',

  // Group G
  'BEL': 'Belgium',
  'IRN': 'Iran',
  'EGY': 'Egypt',
  'NZL': 'New Zealand',

  // Group H
  'ESP': 'Spain',
  'URU': 'Uruguay',
  'SAU': 'Saudi Arabia',
  'CPV': ['Cape Verde', 'Cabo Verde'],

  // Group I
  'FRA': 'France',
  'SEN': 'Senegal',
  'NOR': 'Norway',
  'IRQ': 'Iraq',

  // Group J
  'ARG': 'Argentina',
  'AUT': 'Austria',
  'ALG': 'Algeria',
  'JOR': 'Jordan',

  // Group K
  'POR': 'Portugal',
  'COL': 'Colombia',
  'UZB': 'Uzbekistan',
  'COD': ['DR Congo', 'Congo DR', 'Democratic Republic of Congo'],

  // Group L
  'ENG': 'England',
  'CRO': 'Croatia',
  'GHA': 'Ghana',
  'PAN': 'Panama',
};

async function getWorldCupTeams() {
  try {
    console.log('API-Football에서 2026 World Cup 팀 정보 가져오는 중...\n');

    const response = await axios.get('https://v3.football.api-sports.io/teams', {
      headers: {
        'x-rapidapi-host': apiHost,
        'x-rapidapi-key': apiKey
      },
      params: {
        league: 1, // World Cup
        season: 2026
      }
    });

    console.log(`✅ ${response.data.response.length}개 팀 정보 수신\n`);

    return response.data.response.map(item => ({
      id: item.team.id,
      name: item.team.name,
      code: item.team.code
    }));
  } catch (error) {
    console.error('❌ API 호출 실패:', error.response?.data || error.message);
    throw error;
  }
}

function matchTeam(ourId, apiTeams) {
  const searchNames = TEAM_NAME_MAPPING[ourId];

  if (!searchNames) {
    console.log(`⚠️  ${ourId}: 미확정 팀 (플레이오프 결정 대기)`);
    return null;
  }

  const names = Array.isArray(searchNames) ? searchNames : [searchNames];

  for (const name of names) {
    const found = apiTeams.find(team =>
      team.name.toLowerCase() === name.toLowerCase() ||
      team.code?.toLowerCase() === ourId.toLowerCase()
    );
    if (found) {
      return found;
    }
  }

  return null;
}

async function generateMapping() {
  try {
    const apiTeams = await getWorldCupTeams();
    const mappings = [];
    const notFound = [];

    console.log('팀 ID 매핑 생성 중...\n');
    console.log('─'.repeat(80));

    for (const [ourId, searchNames] of Object.entries(TEAM_NAME_MAPPING)) {
      const matched = matchTeam(ourId, apiTeams);

      if (matched) {
        mappings.push({
          our_team_id: ourId,
          api_team_id: matched.id,
          api_team_name: matched.name,
          api_team_code: matched.code
        });
        console.log(`✅ ${ourId.padEnd(12)} → API ID: ${String(matched.id).padEnd(5)} | ${matched.name} (${matched.code || 'N/A'})`);
      } else if (searchNames === null) {
        // 미확정 팀은 무시
      } else {
        notFound.push(ourId);
        console.log(`❌ ${ourId.padEnd(12)} → 매칭 실패 (검색명: ${Array.isArray(searchNames) ? searchNames.join(', ') : searchNames})`);
      }
    }

    console.log('─'.repeat(80));
    console.log(`\n매핑 완료: ${mappings.length}개 팀`);
    console.log(`미확정: ${Object.values(TEAM_NAME_MAPPING).filter(v => v === null).length}개 팀 (플레이오프)`);

    if (notFound.length > 0) {
      console.log(`\n⚠️  매칭 실패한 팀: ${notFound.join(', ')}`);
      console.log('→ TEAM_NAME_MAPPING의 이름을 수정하거나 API 데이터를 확인하세요.\n');
    }

    // SQL INSERT 문 생성
    console.log('\n' + '='.repeat(80));
    console.log('SQL INSERT 문:');
    console.log('='.repeat(80));
    console.log('INSERT INTO team_mapping (our_team_id, api_team_id, api_team_name, api_team_code)');
    console.log('VALUES');

    const sqlValues = mappings.map(m =>
      `  ('${m.our_team_id}', ${m.api_team_id}, '${m.api_team_name.replace(/'/g, "''")}', '${m.api_team_code || ''}')`
    ).join(',\n');

    console.log(sqlValues);
    console.log('ON CONFLICT (our_team_id) DO UPDATE');
    console.log('  SET api_team_id = EXCLUDED.api_team_id,');
    console.log('      api_team_name = EXCLUDED.api_team_name,');
    console.log('      api_team_code = EXCLUDED.api_team_code;');
    console.log('='.repeat(80));

    // JSON 파일로도 저장
    const fs = await import('fs');
    fs.writeFileSync(
      'scripts/team_mapping.json',
      JSON.stringify(mappings, null, 2)
    );
    console.log('\n✅ 매핑 데이터를 scripts/team_mapping.json에 저장했습니다.');

  } catch (error) {
    console.error('\n❌ 매핑 생성 실패:', error.message);
    process.exit(1);
  }
}

generateMapping();
