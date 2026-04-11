/**
 * 팀 폼 데이터 수동 새로고침 (one-shot CLI)
 *
 * - team_mapping.json (scripts/) 에서 our_team_id ↔ api_team_id 매핑 로드
 * - 각 팀별로 API-Football /fixtures?team=&last=10 호출 → cache/team_form_worldcup_2026.json 저장
 * - DB 없이 동작 (server/index.js 의 /api/team-form/refresh 와 별개)
 *
 * 사용법:
 *   API_FOOTBALL_KEY=키값 node scripts/refresh-form.js
 *   API_FOOTBALL_KEY=키값 node scripts/refresh-form.js --last=5   # 폼 윈도우 변경
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { refreshAll, FORM_LAST_N } from '../server/services/teamFormService.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const API_KEY = process.env.API_FOOTBALL_KEY;
if (!API_KEY) {
  console.error('ERROR: API_FOOTBALL_KEY 환경변수가 필요합니다.');
  console.error('사용법: API_FOOTBALL_KEY=키값 node scripts/refresh-form.js');
  process.exit(1);
}

// CLI 옵션 파싱
const args = process.argv.slice(2);
const lastArg = args.find(a => a.startsWith('--last='));
const lastN = lastArg ? parseInt(lastArg.split('=')[1], 10) : FORM_LAST_N;

// team_mapping 로드
const mappingFile = JSON.parse(readFileSync(join(__dirname, 'team_mapping.json'), 'utf8'));
const teamMapping = {};
mappingFile.forEach(m => {
  if (m.our_team_id && m.api_team_id) {
    teamMapping[m.our_team_id] = m.api_team_id;
  }
});

console.log(`[Form Refresh] ${Object.keys(teamMapping).length}개 팀, last=${lastN}`);

/**
 * API-Football /fixtures?team=&last= 호출 (DB/캐시 없이 직접)
 */
async function fetchLastN(apiTeamId, n) {
  const url = new URL('https://v3.football.api-sports.io/fixtures');
  url.searchParams.set('team', String(apiTeamId));
  url.searchParams.set('last', String(n));

  const resp = await fetch(url.toString(), {
    headers: { 'x-apisports-key': API_KEY },
  });

  if (!resp.ok) {
    throw new Error(`API HTTP ${resp.status}: ${await resp.text()}`);
  }

  const remaining = resp.headers.get('x-ratelimit-requests-remaining');
  const limit = resp.headers.get('x-ratelimit-requests-limit');
  if (remaining != null) {
    process.stdout.write(`\r[API] Rate Limit: ${remaining}/${limit} 남음        `);
  }

  const data = await resp.json();
  return data?.response ?? [];
}

try {
  const saved = await refreshAll({ teamMapping, fetchLastN, lastN });
  console.log('\n');
  console.log(`✅ 저장 완료: cache/team_form_worldcup_2026.json`);
  console.log(`   집계: ${Object.keys(saved.data).length}팀`);
  console.log(`   스킵: ${saved.skipped.length}팀`);
  console.log(`   fetchedAt: ${saved.fetchedAt}`);
  console.log(`   todayFetchCount: ${saved.todayFetchCount}`);

  if (saved.skipped.length > 0) {
    console.log('\n⚠️  스킵된 팀:');
    saved.skipped.slice(0, 10).forEach(s => {
      console.log(`   - ${s.teamId}: ${s.reason}`);
    });
  }

  // sample 출력
  const sample = Object.entries(saved.data).slice(0, 5);
  if (sample.length > 0) {
    console.log('\n📊 샘플 (상위 5팀):');
    sample.forEach(([id, form]) => {
      console.log(`   ${id}: n=${form.n}, GF=${form.gfPerGame}, GA=${form.gaPerGame}`);
    });
  }
} catch (err) {
  console.error('\n❌ 새로고침 실패:', err.message);
  process.exit(1);
}
