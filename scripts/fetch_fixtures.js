/**
 * API-Football에서 2026 월드컵 조별리그 일정을 가져와서
 * 현재 data.js의 MATCH_SCHEDULE과 비교/출력하는 일회성 스크립트
 *
 * 사용법: API_FOOTBALL_KEY=키값 node scripts/fetch_fixtures.js
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const API_KEY = process.env.API_FOOTBALL_KEY;
if (!API_KEY) {
  console.error('ERROR: API_FOOTBALL_KEY 환경변수가 필요합니다.');
  console.error('사용법: API_FOOTBALL_KEY=키값 node scripts/fetch_fixtures.js');
  process.exit(1);
}

// team_mapping 로드 (api_team_id → our_team_id)
const mapping = JSON.parse(readFileSync(join(__dirname, 'team_mapping.json'), 'utf8'));
const apiToOur = Object.fromEntries(mapping.map(m => [m.api_team_id, m.our_team_id]));

async function fetchFixtures() {
  const url = new URL('https://v3.football.api-sports.io/fixtures');
  url.searchParams.set('league', '1');
  url.searchParams.set('season', '2026');

  console.log('[API] Fetching fixtures...');
  const resp = await fetch(url.toString(), {
    headers: { 'x-apisports-key': API_KEY },
  });

  if (!resp.ok) {
    console.error(`API HTTP ${resp.status}: ${await resp.text()}`);
    process.exit(1);
  }

  const data = await resp.json();
  const remaining = resp.headers.get('x-ratelimit-requests-remaining');
  console.log(`[API] ${data.response.length} fixtures received (rate limit remaining: ${remaining})`);

  return data.response;
}

function processFixtures(fixtures) {
  // 팀ID → 조 매핑 (INITIAL_GROUPS 기반)
  const teamToGroup = {
    MEX:'A', KOR:'A', RSA:'A', CZE:'A',
    CAN:'B', CHE:'B', QAT:'B', BIH:'B',
    BRA:'C', MAR:'C', SCO:'C', HTI:'C',
    USA:'D', AUS:'D', PAR:'D', TUR:'D',
    GER:'E', ECU:'E', CIV:'E', CUW:'E',
    NED:'F', JPN:'F', TUN:'F', SWE:'F',
    BEL:'G', IRN:'G', EGY:'G', NZL:'G',
    ESP:'H', URU:'H', SAU:'H', CPV:'H',
    FRA:'I', SEN:'I', NOR:'I', IRQ:'I',
    ARG:'J', AUT:'J', ALG:'J', JOR:'J',
    POR:'K', COL:'K', UZB:'K', COD:'K',
    ENG:'L', CRO:'L', GHA:'L', PAN:'L',
  };

  // 조별리그만 필터 — "Group Stage - N" 또는 "Group X - N" 형식 모두 지원
  const groupFixtures = fixtures.filter(f =>
    f.league.round?.startsWith('Group')
  );

  console.log(`[Filter] ${groupFixtures.length} group stage fixtures`);

  const groups = {};
  for (const f of groupFixtures) {
    // "Group Stage - 1" 또는 "Group A - 1" 에서 매치데이 추출
    const mdMatch = f.league.round.match(/- (\d)/);
    if (!mdMatch) {
      console.warn(`  Skipping unknown round: ${f.league.round}`);
      continue;
    }
    const matchday = parseInt(mdMatch[1]);

    const homeId = apiToOur[f.teams.home.id];
    const awayId = apiToOur[f.teams.away.id];

    if (!homeId || !awayId) {
      console.warn(`  Unknown team: ${f.teams.home.name}(${f.teams.home.id}) or ${f.teams.away.name}(${f.teams.away.id})`);
      continue;
    }

    // 팀으로 조 판별
    const groupLetter = teamToGroup[homeId] || teamToGroup[awayId];
    if (!groupLetter) {
      console.warn(`  Unknown group for: ${homeId} vs ${awayId}`);
      continue;
    }

    const matchId = `${homeId}_vs_${awayId}`;
    const date = f.fixture.date;
    const venue = f.fixture.venue?.name || 'TBD';
    const city = f.fixture.venue?.city || 'TBD';

    if (!groups[groupLetter]) groups[groupLetter] = [];
    groups[groupLetter].push({
      matchId,
      matchday,
      date,
      venue,
      city,
      home: homeId,
      away: awayId,
    });
  }

  return groups;
}

function validateSchedule(groups) {
  console.log('\n══════════════════════════════════════════');
  console.log('  MATCH SCHEDULE VALIDATION');
  console.log('══════════════════════════════════════════\n');

  let errors = 0;
  for (const [g, matches] of Object.entries(groups).sort()) {
    const teams = new Set();
    matches.forEach(m => { teams.add(m.home); teams.add(m.away); });
    const teamList = [...teams].sort().join(', ');

    console.log(`── Group ${g} (${teamList}) ──`);

    // MD별 체크
    for (let md = 1; md <= 3; md++) {
      const mdMatches = matches.filter(m => m.matchday === md);
      const mdTeams = mdMatches.flatMap(m => [m.home, m.away]);
      const dupes = mdTeams.filter((t, i) => mdTeams.indexOf(t) !== i);

      if (dupes.length > 0) {
        console.log(`  ❌ MD${md}: ${dupes.join(', ')} plays TWICE!`);
        errors++;
      }

      for (const m of mdMatches) {
        console.log(`  MD${md}: ${m.matchId.padEnd(15)} ${m.date.slice(0, 16)} ${m.venue}`);
      }
    }

    if (matches.length !== 6) {
      console.log(`  ❌ Expected 6 matches, got ${matches.length}`);
      errors++;
    }
    console.log();
  }

  return errors;
}

function generateMatchSchedule(groups) {
  console.log('\n══════════════════════════════════════════');
  console.log('  GENERATED MATCH_SCHEDULE (copy to data.js)');
  console.log('══════════════════════════════════════════\n');

  const groupNames = {
    A: 'MEX · KOR · RSA · CZE', B: 'CAN · CHE · QAT · BIH',
    C: 'BRA · MAR · SCO · HTI', D: 'USA · AUS · PAR · TUR',
    E: 'GER · ECU · CIV · CUW', F: 'NED · JPN · TUN · SWE',
    G: 'BEL · IRN · EGY · NZL', H: 'ESP · URU · SAU · CPV',
    I: 'FRA · SEN · NOR · IRQ', J: 'ARG · AUT · ALG · JOR',
    K: 'POR · COL · UZB · COD', L: 'ENG · CRO · GHA · PAN',
  };

  for (const [g, matches] of Object.entries(groups).sort()) {
    const sorted = matches.sort((a, b) => a.matchday - b.matchday || a.date.localeCompare(b.date));
    const label = groupNames[g] || sorted.map(m => m.home).join(' · ');

    console.log(`  // ── Group ${g} (${label}) ──────────────────────`);
    for (const m of sorted) {
      const pad = m.matchId.length < 12 ? '    ' : '';
      console.log(`  '${m.matchId}':${pad}     { matchday: ${m.matchday}, date: '${m.date}', venue: '${m.venue}', city: '${m.city}' },`);
    }
    console.log();
  }
}

// ── Main ──
const fixtures = await fetchFixtures();
const groups = processFixtures(fixtures);
const errorCount = validateSchedule(groups);

if (errorCount === 0) {
  console.log('✅ All groups valid!\n');
} else {
  console.log(`❌ ${errorCount} error(s) found!\n`);
}

generateMatchSchedule(groups);
