// 조별 순위 계산 유틸리티
import { TEAM_SEEDS, MATCH_SCHEDULE } from '../data/worldcup2026.js';

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

  // FIFA 순위 결정 기준: 승점 → 득실차 → 다득점 → 헤드투헤드
  arr.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    // 헤드투헤드 (동점 팀들 사이)
    const tied = arr.filter(
      (t) => t.pts === a.pts && t.gd === a.gd && t.gf === a.gf
    );
    if (tied.length < arr.length) {
      const h2h = getHeadToHead(tied.map((t) => t.id), matches);
      if (h2h[b.id] && h2h[a.id]) {
        if (h2h[b.id].pts !== h2h[a.id].pts) return h2h[b.id].pts - h2h[a.id].pts;
        if (h2h[b.id].gd !== h2h[a.id].gd) return h2h[b.id].gd - h2h[a.id].gd;
        if (h2h[b.id].gf !== h2h[a.id].gf) return h2h[b.id].gf - h2h[a.id].gf;
      }
    }
    // ⑦ 페어플레이 포인트 (높을수록 유리)
    const fpA = getFP(a), fpB = getFP(b);
    if (fpB !== fpA) return fpB - fpA;
    // ⑧ 최종 타이브레이커: 포트 시드 순서
    return getSeed(a.id) - getSeed(b.id);
  });

  return arr;
}

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
      return getSeed(a.id) - getSeed(b.id);
    })
    .slice(0, 8);
}
