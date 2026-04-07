/**
 * 조별 잔여 경기 W/D/L 전수 탐색으로 각 팀이 도달 가능한 순위 집합 계산
 * 반환: { teamId: Set<rank> }
 */
import { calculateStandings } from './rankings.js';

const OUTCOMES = [['1', '0'], ['0', '0'], ['0', '1']];

export function computeGroupRankPossibilities(teams, matches, options = {}) {
  const result = {};
  for (const t of teams) result[t.id] = new Set();

  const remaining = matches.filter((m) => !m.played);
  if (remaining.length === 0) {
    const s = calculateStandings(teams, matches, options);
    s.forEach((t, i) => result[t.id].add(i + 1));
    return result;
  }

  const remIdx = remaining.map((rm) => matches.findIndex((m) => m.id === rm.id));
  const ms = [...matches];

  function iter(idx) {
    if (idx === remaining.length) {
      const s = calculateStandings(teams, ms, options);
      s.forEach((t, i) => result[t.id].add(i + 1));
      return;
    }
    const mi = remIdx[idx];
    const orig = ms[mi];
    for (const [h, a] of OUTCOMES) {
      ms[mi] = { ...orig, homeScore: h, awayScore: a, played: true };
      iter(idx + 1);
    }
    ms[mi] = orig;
  }

  iter(0);
  return result;
}
