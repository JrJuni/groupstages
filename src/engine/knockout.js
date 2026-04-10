/**
 * 범용 토너먼트 대진표 엔진
 * 브래킷 슬롯 해석, 3위 배치표 기반 배정, 하이라이트 매칭
 */
import { calculateStandings } from './rankings.js';

// ── 3위팀 가능 승점/GD 범위 계산 ─────────────────────────────
// remaining ≤ 2 (마지막 매치데이): 마진 1~10 확장 (21^2=441 조합)
// remaining > 2: W/D/L만 (3^N), GD는 ±Infinity
// GD 범위가 ±GD_THRESHOLD를 넘으면 신뢰 불가 → ±Infinity 처리
const GD_THRESHOLD = 4;

export function computeThirdRange(teams, matches, standingsOptions) {
  const remaining = matches.filter((m) => !m.played);
  if (remaining.length === 0) {
    const s = calculateStandings(teams, matches, standingsOptions);
    const t = s[2];
    return t ? { min: t.pts, max: t.pts, minGD: t.gd, maxGD: t.gd } : { min: 0, max: 0, minGD: 0, maxGD: 0 };
  }
  let minPts = Infinity, maxPts = -Infinity, minGD = Infinity, maxGD = -Infinity;

  const remIdx = remaining.map((rm) => matches.findIndex((m) => m.id === rm.id));

  // 마지막 매치데이: 마진 1~10 확장으로 실제 GD 상하한 계산
  // 그 이전: W/D/L만 (마진 조합 폭발 방지)
  const MAX_MARGIN = remaining.length <= 2 ? 10 : 1;
  const OUTCOMES = [];
  for (let m = 1; m <= MAX_MARGIN; m++) OUTCOMES.push([String(m), '0']);
  OUTCOMES.push(['0', '0']);
  for (let m = 1; m <= MAX_MARGIN; m++) OUTCOMES.push(['0', String(m)]);

  function iter(idx, ms) {
    if (idx === remaining.length) {
      const t = calculateStandings(teams, ms, standingsOptions)[2];
      if (t) {
        if (t.pts < minPts) minPts = t.pts;
        if (t.pts > maxPts) maxPts = t.pts;
        if (t.gd < minGD) minGD = t.gd;
        if (t.gd > maxGD) maxGD = t.gd;
      }
      return;
    }
    const mi = remIdx[idx];
    const orig = ms[mi];
    for (const [h, a] of OUTCOMES) {
      ms[mi] = { ...orig, homeScore: h, awayScore: a, played: true };
      iter(idx + 1, ms);
    }
    ms[mi] = orig;
  }

  iter(0, [...matches]);

  const gdReliable = remaining.length <= 2;
  return {
    min: minPts === Infinity ? 0 : minPts,
    max: maxPts === -Infinity ? 0 : maxPts,
    minGD: (!gdReliable || minGD < -GD_THRESHOLD) ? -Infinity : (minGD === Infinity ? 0 : minGD),
    maxGD: (!gdReliable || maxGD > GD_THRESHOLD) ? Infinity : (maxGD === -Infinity ? 0 : maxGD),
  };
}

/**
 * 유효한 3위 조합 필터링 + 슬롯별 확정 여부 계산
 * @param {Object} thirdPlaceTable - 495개 조합 룩업테이블
 * @param {Object} groups          - { A: { teams, matches, standings }, ... }
 * @param {Object} [options]       - { standingsOptions }
 * @returns {{ validKeys: string[], slotConfirmed: Object, eliminatedGroups: Set }}
 */
export function analyzeThirdPlaceCombinations(thirdPlaceTable, groups, options = {}) {
  const { standingsOptions = {} } = options;
  const groupKeys = Object.keys(groups);

  // 1. 각 조 3위팀 가능 승점 범위
  const ranges = {};
  for (const key of groupKeys) {
    const { teams, matches } = groups[key];
    ranges[key] = computeThirdRange(teams, matches, standingsOptions);
  }

  // 2. 확정 탈락: 최선의 경우에도 다른 8개 조 최악보다 확실히 못한 팀
  //    GD가 ±Infinity인 조는 비교 자동 스킵 (-Inf > X → false)
  const eliminatedGroups = new Set();
  for (const g of groupKeys) {
    const selfBest = ranges[g].max;
    let definitelyAbove = 0;
    for (const other of groupKeys) {
      if (other === g) continue;
      if (ranges[other].min > selfBest) {
        definitelyAbove++;
      } else if (ranges[other].min === selfBest
        && ranges[other].minGD > ranges[g].maxGD) {
        definitelyAbove++;
      }
    }
    if (definitelyAbove >= 8) eliminatedGroups.add(g);
  }

  // 3. 확정 진출: 최악의 경우에도 top 8 보장
  //    GD가 ±Infinity인 조는 보수적 처리 (Inf >= X → true)
  const qualifiedGroups = new Set();
  for (const g of groupKeys) {
    const selfWorst = ranges[g].min;
    let couldBeAbove = 0;
    for (const other of groupKeys) {
      if (other === g) continue;
      if (ranges[other].max > selfWorst) {
        couldBeAbove++;
      } else if (ranges[other].max === selfWorst
        && ranges[other].maxGD >= ranges[g].minGD) {
        couldBeAbove++;
      }
    }
    if (couldBeAbove < 8) qualifiedGroups.add(g);
  }

  // 4. 유효 조합 필터링
  const validKeys = [];
  for (const key of Object.keys(thirdPlaceTable)) {
    const comboGroups = new Set(key.split(''));
    let valid = true;

    // 확정 탈락 그룹이 포함되면 무효
    for (const eg of eliminatedGroups) {
      if (comboGroups.has(eg)) { valid = false; break; }
    }
    // 확정 진출 그룹이 미포함이면 무효
    if (valid) {
      for (const qg of qualifiedGroups) {
        if (!comboGroups.has(qg)) { valid = false; break; }
      }
    }

    if (valid) validKeys.push(key);
  }

  // 5. 슬롯별 확정 여부: 모든 유효 조합에서 동일 그룹이면 확정
  const slotConfirmed = {}; // matchId → group (확정 시) 또는 null
  if (validKeys.length > 0) {
    const firstCombo = thirdPlaceTable[validKeys[0]];
    for (const matchId of Object.keys(firstCombo)) {
      const group = firstCombo[matchId];
      const allSame = validKeys.every((k) => thirdPlaceTable[k][matchId] === group);
      slotConfirmed[matchId] = allSame ? group : null;
    }
  }

  return { validKeys, slotConfirmed, eliminatedGroups, qualifiedGroups };
}

/**
 * R32 슬롯 descriptor → 실제 팀 객체 매핑
 */
export function resolveR32Teams(bracket, allGroupStandings, rankedThirds, thirdPlaceTable) {
  const resolved = {};

  const qualGroups = rankedThirds.map((t) => t.group).filter(Boolean).sort().join('');
  const tableEntry = thirdPlaceTable?.[qualGroups] || null;

  const slotAssignments = {};
  if (tableEntry) {
    for (const [matchId, group] of Object.entries(tableEntry)) {
      const third = rankedThirds.find((t) => t.group === group);
      if (third) slotAssignments[matchId] = third;
    }
  }

  function resolveDescriptor(match, side) {
    const desc = match[side];
    if (!desc) return { team: null, label: '' };
    if (desc === '3rd') {
      const team = slotAssignments[match.id] || null;
      const label = `3위 ${(match.thirdFrom || []).join('/')}`;
      return { team, label };
    }
    const groupMatch = desc.match(/^([12])([A-L])$/);
    if (groupMatch) {
      const rank = parseInt(groupMatch[1]);
      const group = groupMatch[2];
      const standings = allGroupStandings[group];
      const team = standings?.[rank - 1] || null;
      return { team, label: desc };
    }
    return { team: null, label: desc };
  }

  for (const match of bracket) {
    if (match.round !== 'R32') continue;
    const t1 = resolveDescriptor(match, 'team1');
    const t2 = resolveDescriptor(match, 'team2');
    resolved[match.id] = {
      team1: t1.team, team2: t2.team,
      team1Label: t1.label, team2Label: t2.label,
    };
  }
  return resolved;
}

/**
 * 각 R32 슬롯의 확정 여부 계산
 */
export function computeConfirmedSlots(bracket, groups, thirdSlotConfirmed) {
  const groupConfirmed = {};
  for (const [key, { matches, standings }] of Object.entries(groups)) {
    const remaining = matches.filter((m) => !m.played);
    const allDone = remaining.length === 0;

    let firstConfirmed = allDone;
    if (!allDone && standings.length >= 2) {
      const firstPts = standings[0].pts;
      firstConfirmed = standings.slice(1).every((t) => {
        const teamRemaining = remaining.filter(
          (m) => m.home === t.id || m.away === t.id
        ).length;
        return t.pts + teamRemaining * 3 < firstPts;
      });
    }

    groupConfirmed[key] = {
      first: firstConfirmed,
      second: allDone,
    };
  }

  const confirmed = {};
  for (const match of bracket) {
    if (match.round !== 'R32') continue;
    confirmed[match.id] = {
      team1Confirmed: isSlotConfirmed(match.team1, groupConfirmed, thirdSlotConfirmed, match.id),
      team2Confirmed: isSlotConfirmed(match.team2, groupConfirmed, thirdSlotConfirmed, match.id),
    };
  }
  return confirmed;
}

function isSlotConfirmed(desc, groupConfirmed, thirdSlotConfirmed, matchId) {
  if (!desc) return false;
  if (desc === '3rd') return thirdSlotConfirmed?.[matchId] != null;
  const m = desc.match(/^([12])([A-L])$/);
  if (!m) return false;
  const rank = m[1], group = m[2];
  if (rank === '1') return groupConfirmed[group]?.first ?? false;
  if (rank === '2') return groupConfirmed[group]?.second ?? false;
  return false;
}

/**
 * 특정 그룹 클릭 시 하이라이트할 매치 목록
 * validKeys가 있으면 유효 조합 기반으로 3위 가능 위치 필터링
 */
export function getHighlightedMatchIds(bracket, groupKey, rankedThirds, validKeys, thirdPlaceTable) {
  const highlights = [];

  // 유효 조합에서 해당 그룹의 3위가 배정될 수 있는 매치 Set
  let validThirdMatches = null;
  if (validKeys && thirdPlaceTable) {
    validThirdMatches = new Set();
    for (const key of validKeys) {
      if (!key.includes(groupKey)) continue; // 이 조합에 해당 그룹 미포함
      const entry = thirdPlaceTable[key];
      for (const [matchId, group] of Object.entries(entry)) {
        if (group === groupKey) validThirdMatches.add(matchId);
      }
    }
  }

  for (const match of bracket) {
    if (match.round !== 'R32') continue;

    if (match.team1 === `1${groupKey}`) highlights.push({ matchId: match.id, teamSide: 'team1', type: '1st' });
    if (match.team1 === `2${groupKey}`) highlights.push({ matchId: match.id, teamSide: 'team1', type: '2nd' });
    if (match.team2 === `1${groupKey}`) highlights.push({ matchId: match.id, teamSide: 'team2', type: '1st' });
    if (match.team2 === `2${groupKey}`) highlights.push({ matchId: match.id, teamSide: 'team2', type: '2nd' });

    // 3위: 유효 조합 기반 필터링
    if (match.team2 === '3rd' && match.thirdFrom?.includes(groupKey)) {
      if (!validThirdMatches || validThirdMatches.has(match.id)) {
        highlights.push({ matchId: match.id, teamSide: 'team2', type: '3rd' });
      }
    }
    if (match.team1 === '3rd' && match.thirdFrom?.includes(groupKey)) {
      if (!validThirdMatches || validThirdMatches.has(match.id)) {
        highlights.push({ matchId: match.id, teamSide: 'team1', type: '3rd' });
      }
    }
  }

  return highlights;
}

/**
 * 각 3위 슬롯에 올 수 있는 후보 팀 — 유효 조합 기반 필터링
 */
export function getThirdCandidatesPerSlot(bracket, rankedThirds, validKeys, thirdPlaceTable) {
  const candidates = {};

  // 유효 조합에서 각 슬롯에 올 수 있는 그룹 집합
  const validGroupsPerSlot = {};
  if (validKeys && thirdPlaceTable) {
    for (const key of validKeys) {
      const entry = thirdPlaceTable[key];
      for (const [matchId, group] of Object.entries(entry)) {
        if (!validGroupsPerSlot[matchId]) validGroupsPerSlot[matchId] = new Set();
        validGroupsPerSlot[matchId].add(group);
      }
    }
  }

  for (const match of bracket) {
    if (match.round !== 'R32') continue;
    if (match.team2 !== '3rd' && match.team1 !== '3rd') continue;

    const validGroups = validGroupsPerSlot[match.id];
    if (validGroups) {
      // 유효 조합 기반: 실제 가능한 팀만
      candidates[match.id] = rankedThirds.filter((t) => validGroups.has(t.group));
    } else {
      // fallback: thirdFrom 기반
      const thirdFrom = match.thirdFrom || [];
      candidates[match.id] = rankedThirds.filter((t) => thirdFrom.includes(t.group));
    }
  }

  return candidates;
}
