/**
 * 범용 조별리그 순위 계산 엔진
 * FIFA 등 특정 대회 데이터에 의존하지 않음 — 모든 설정은 파라미터로 주입
 */

// ── 기본 페어플레이 점수 (FIFA 기본값) ─────────────────────
const DEFAULT_FAIR_PLAY = (team) =>
  -1 * (team.yc || 0) + -3 * (team.twoYR || 0) + -4 * (team.dr || 0);

// ── 초기 스탠딩 생성 ───────────────────────────────────────
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

// ── 페어플레이 점수 (외부 공개용) ──────────────────────────
export function getFairPlayPoints(team, fairPlayScorer = DEFAULT_FAIR_PLAY) {
  return fairPlayScorer(team);
}

// ── 초기 매치 생성 ─────────────────────────────────────────
/**
 * @param {Array} teams
 * @param {Object} matchSchedule - id → { matchday, date, venue, city }. 빈 객체 허용.
 */
export function createInitialMatches(teams, matchSchedule = {}) {
  const matches = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const id = `${teams[i].id}_vs_${teams[j].id}`;
      const altId = `${teams[j].id}_vs_${teams[i].id}`;
      const sched = matchSchedule[id] || matchSchedule[altId] || {};
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

// ── 헤드투헤드 ─────────────────────────────────────────────
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

// ── 순위 계산 ──────────────────────────────────────────────
/**
 * @param {Array} teams
 * @param {Array} matches
 * @param {Object} [options]
 * @param {Array<Function>} [options.tiebreakers] - h2h 이후 추가 타이브레이커 [(a,b)=>number, ...]
 * @param {Function} [options.fairPlayScorer]     - 페어플레이 점수 함수
 */
export function calculateStandings(teams, matches, options = {}) {
  const { tiebreakers = [], fairPlayScorer = DEFAULT_FAIR_PLAY } = options;

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

  arr.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return 0;
  });

  return resolveTiedGroups(arr, matches, tiebreakers, fairPlayScorer);
}

// ── 동점 그룹 재귀 해결 ────────────────────────────────────
function resolveTiedGroups(sorted, matches, tiebreakers, fairPlayScorer) {
  const result = [];
  let i = 0;

  while (i < sorted.length) {
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
      result.push(sorted[i]);
    } else {
      const tiedGroup = sorted.slice(i, j);
      const resolved = resolveByHeadToHead(tiedGroup, matches, tiebreakers, fairPlayScorer);
      result.push(...resolved);
    }
    i = j;
  }

  return result;
}

// ── 헤드투헤드 기반 동점 해결 ──────────────────────────────
function resolveByHeadToHead(tiedTeams, matches, tiebreakers, fairPlayScorer) {
  if (tiedTeams.length <= 1) return tiedTeams;

  const h2h = getHeadToHead(tiedTeams.map((t) => t.id), matches);

  const h2hSorted = [...tiedTeams].sort((a, b) => {
    const ha = h2h[a.id], hb = h2h[b.id];
    if (hb.pts !== ha.pts) return hb.pts - ha.pts;
    if (hb.gd !== ha.gd) return hb.gd - ha.gd;
    if (hb.gf !== ha.gf) return hb.gf - ha.gf;
    return 0;
  });

  const allSame = h2hSorted.every((t) => {
    const s = h2h[t.id];
    const f = h2h[h2hSorted[0].id];
    return s.pts === f.pts && s.gd === f.gd && s.gf === f.gf;
  });

  if (allSame) {
    return resolveByFinalTiebreakers(h2hSorted, tiebreakers, fairPlayScorer);
  }

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
      if (subGroup.length < tiedTeams.length) {
        result.push(...resolveByHeadToHead(subGroup, matches, tiebreakers, fairPlayScorer));
      } else {
        result.push(...resolveByFinalTiebreakers(subGroup, tiebreakers, fairPlayScorer));
      }
    }
    i = j;
  }

  return result;
}

// ── 최종 타이브레이커: 페어플레이 → 커스텀 체인 ────────────
function resolveByFinalTiebreakers(teams, tiebreakers, fairPlayScorer) {
  return [...teams].sort((a, b) => {
    // 1. 페어플레이
    const fpDiff = fairPlayScorer(b) - fairPlayScorer(a);
    if (fpDiff !== 0) return fpDiff;
    // 2. 커스텀 타이브레이커 체인
    for (const fn of tiebreakers) {
      const diff = fn(a, b);
      if (diff !== 0) return diff;
    }
    return 0;
  });
}

// ── 3위팀 상위 N팀 선별 ────────────────────────────────────
/**
 * @param {Object} allGroupStandings - { A: [...standings], B: [...], ... }
 * @param {number} count             - 선별할 3위팀 수 (e.g. 8)
 * @param {Object} [options]
 * @param {Array<Function>} [options.tiebreakers] - 추가 타이브레이커
 * @param {Function} [options.fairPlayScorer]     - 페어플레이 함수
 */
export function getBestThirdPlace(allGroupStandings, count, options = {}) {
  const { tiebreakers = [], fairPlayScorer = DEFAULT_FAIR_PLAY } = options;

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
      const fpDiff = fairPlayScorer(b) - fairPlayScorer(a);
      if (fpDiff !== 0) return fpDiff;
      for (const fn of tiebreakers) {
        const diff = fn(a, b);
        if (diff !== 0) return diff;
      }
      return 0;
    })
    .slice(0, count);
}
