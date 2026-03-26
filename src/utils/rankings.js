// 조별 순위 계산 유틸리티
import { TEAM_SEEDS, FIFA_RANKINGS, MATCH_SCHEDULE } from '../data/worldcup2026.js';

function getFP(team) { return -1*(team.yc||0) + -3*(team.twoYR||0) + -4*(team.dr||0); }

// 시드 번호 조회 (없으면 99로 처리 → 미확정 플레이오프 팀)
function getSeed(id) { return TEAM_SEEDS[id] ?? 99; }

export function createInitialStandings(teams) {
  return teams.map((team) => ({
    ...team,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    pts: 0,
    yc: team.yc ?? 0,
    twoYR: team.twoYR ?? 0,
    dr: team.dr ?? 0,
  }));
}

export function getFairPlayPoints(team) {
  return -1 * (team.yc || 0) + -3 * (team.twoYR || 0) + -4 * (team.dr || 0);
}

export function createInitialMatches(teams) {
  const matches = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const id = `${teams[i].id}_vs_${teams[j].id}`;
      const sched = MATCH_SCHEDULE[id] || {};
      matches.push({
        id,
        home: teams[i].id,
        away: teams[j].id,
        homeScore: null,
        awayScore: null,
        matchday: sched.matchday ?? null,
        date: sched.date ?? null,
        venue: sched.venue ?? null,
        city: sched.city ?? null,
        played: false,
      });
    }
  }
  return matches;
}

// 두 팀 간의 헤드투헤드 결과 계산
function getHeadToHead(ids, matches) {
  const stats = {};
  ids.forEach((id) => {
    stats[id] = { pts: 0, gd: 0, gf: 0 };
  });
  const idSet = new Set(ids);
  matches.forEach((m) => {
    if (!m.played) return;
    if (!idSet.has(m.home) || !idSet.has(m.away)) return;
    const hs = parseInt(m.homeScore);
    const as_ = parseInt(m.awayScore);
    stats[m.home].gf += hs;
    stats[m.home].gd += hs - as_;
    stats[m.away].gf += as_;
    stats[m.away].gd += as_ - hs;
    if (hs > as_) stats[m.home].pts += 3;
    else if (hs < as_) stats[m.away].pts += 3;
    else { stats[m.home].pts += 1; stats[m.away].pts += 1; }
  });
  return stats;
}

export function calculateStandings(teams, matches) {
  const statsMap = {};
  teams.forEach((t) => {
    statsMap[t.id] = {
      ...t,
      played: 0, won: 0, drawn: 0, lost: 0,
      gf: 0, ga: 0, gd: 0, pts: 0,
    };
  });

  matches.forEach((m) => {
    if (!m.played) return;
    const h = statsMap[m.home];
    const a = statsMap[m.away];
    const hs = parseInt(m.homeScore);
    const as_ = parseInt(m.awayScore);
    h.played++; a.played++;
    h.gf += hs; h.ga += as_;
    a.gf += as_; a.ga += hs;
    h.gd = h.gf - h.ga;
    a.gd = a.gf - a.ga;
    if (hs > as_) { h.won++; h.pts += 3; a.lost++; }
    else if (hs < as_) { a.won++; a.pts += 3; h.lost++; }
    else { h.drawn++; h.pts++; a.drawn++; a.pts++; }
  });

  const arr = Object.values(statsMap);

  // FIFA 순위 결정:
  // ① 전체 리그 기준 1차 정렬 (승점 → 득실차 → 다득점)
  arr.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return 0;
  });

  // ② 동점 그룹 추출 → 재귀적 헤드투헤드 해결
  return resolveTiedGroups(arr, matches);
}

/**
 * 동점 그룹 재귀 해결 (FIFA 규정 준수)
 * 1차 기준(pts, gd, gf)이 동일한 팀들을 그룹으로 묶고,
 * 헤드투헤드 미니리그 → 페어플레이 → 시드 순서로 재귀적 해결
 */
function resolveTiedGroups(sorted, matches) {
  const result = [];
  let i = 0;

  while (i < sorted.length) {
    // 같은 (pts, gd, gf) 팀들을 한 그룹으로 묶기
    let j = i + 1;
    while (
      j < sorted.length &&
      sorted[j].pts === sorted[i].pts &&
      sorted[j].gd === sorted[i].gd &&
      sorted[j].gf === sorted[i].gf
    ) {
      j++;
    }

    if (j - i === 1) {
      // 동점 없음 — 그대로 추가
      result.push(sorted[i]);
    } else {
      // 동점 그룹 → 헤드투헤드 미니리그로 해결
      const tiedGroup = sorted.slice(i, j);
      const resolved = resolveByHeadToHead(tiedGroup, matches);
      result.push(...resolved);
    }
    i = j;
  }

  return result;
}

/**
 * 동점 팀들을 헤드투헤드 미니리그 기준으로 정렬
 * 미니리그에서도 동점이면 → 페어플레이 → 시드로 최종 해결
 */
function resolveByHeadToHead(tiedTeams, matches) {
  if (tiedTeams.length <= 1) return tiedTeams;

  // 헤드투헤드 미니리그 통계 계산
  const h2h = getHeadToHead(tiedTeams.map((t) => t.id), matches);

  // h2h 기준 1차 정렬 (승점 → 득실차 → 다득점)
  const h2hSorted = [...tiedTeams].sort((a, b) => {
    const ha = h2h[a.id], hb = h2h[b.id];
    if (hb.pts !== ha.pts) return hb.pts - ha.pts;
    if (hb.gd !== ha.gd) return hb.gd - ha.gd;
    if (hb.gf !== ha.gf) return hb.gf - ha.gf;
    return 0;
  });

  // h2h로 완전히 분리됐는지 확인
  const allSame = h2hSorted.every((t) => {
    const s = h2h[t.id];
    const f = h2h[h2hSorted[0].id];
    return s.pts === f.pts && s.gd === f.gd && s.gf === f.gf;
  });

  if (allSame) {
    // h2h로도 구분 불가 → 페어플레이 → 시드로 최종 해결
    return resolveByFairPlayAndSeed(h2hSorted);
  }

  // h2h로 부분 분리 → 분리된 서브그룹 재귀 처리
  const result = [];
  let i = 0;
  while (i < h2hSorted.length) {
    let j = i + 1;
    const si = h2h[h2hSorted[i].id];
    while (j < h2hSorted.length) {
      const sj = h2h[h2hSorted[j].id];
      if (sj.pts !== si.pts || sj.gd !== si.gd || sj.gf !== si.gf) break;
      j++;
    }

    if (j - i === 1) {
      result.push(h2hSorted[i]);
    } else {
      const subGroup = h2hSorted.slice(i, j);
      // 3팀 이상 동점에서 h2h로 일부만 분리된 경우,
      // 분리된 서브그룹이 원래 그룹보다 작으면 재귀 (무한루프 방지)
      if (subGroup.length < tiedTeams.length) {
        result.push(...resolveByHeadToHead(subGroup, matches));
      } else {
        result.push(...resolveByFairPlayAndSeed(subGroup));
      }
    }
    i = j;
  }

  return result;
}

/**
 * 최종 타이브레이커: 페어플레이 → 시드 순서
 */
function resolveByFairPlayAndSeed(teams) {
  return [...teams].sort((a, b) => {
    const fpA = getFP(a), fpB = getFP(b);
    if (fpB !== fpA) return fpB - fpA;
    return getSeed(a.id) - getSeed(b.id);
  });
}

function getFifaRank(id) { return FIFA_RANKINGS[id] ?? 999; }

// 3위팀 상위 8팀 선별 (12개 조 중)
// allGroupStandings: { A: [...standings], B: [...], ... }
export function getBest8ThirdPlace(allGroupStandings) {
  const thirds = Object.entries(allGroupStandings)
    .map(([group, standings]) => {
      if (!standings || standings.length < 3) return null;
      return { group, ...standings[2] };
    })
    .filter((t) => t !== null);

  return thirds
    .sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      const fpA = getFP(a), fpB = getFP(b);
      if (fpB !== fpA) return fpB - fpA;
      if (getFifaRank(a.id) !== getFifaRank(b.id)) return getFifaRank(a.id) - getFifaRank(b.id);
      return getSeed(a.id) - getSeed(b.id);
    })
    .slice(0, 8);
}
