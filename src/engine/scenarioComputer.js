/**
 * 범용 포아송 가중 브루트포스 시나리오 엔진
 * 진출 슬롯 수, 3위 커트라인 등을 파라미터로 주입
 */
import { calculateStandings } from './rankings.js';

// 포아송 분포 λ=1.4 근사 골 확률 가중치 (0~8골)
const GOAL_W = [0.25, 0.35, 0.24, 0.10, 0.04, 0.005, 0.005, 0.005, 0.005];

// 0~8 스코어 조합 사전 분류: [homeGoals, awayGoals, weight]
const PAIRS = { W: [], D: [], L: [] };
for (let h = 0; h <= 8; h++) {
  for (let a = 0; a <= 8; a++) {
    const outcome = h > a ? 'W' : h < a ? 'L' : 'D';
    PAIRS[outcome].push([h, a, GOAL_W[h] * GOAL_W[a]]);
  }
}

function teamScorePairs(teamWDL, teamIsHome) {
  if (teamWDL === 'D') return PAIRS.D;
  if (teamIsHome) return PAIRS[teamWDL];
  return teamWDL === 'W' ? PAIRS.L : PAIRS.W;
}

/**
 * 포아송 가중 브루트포스 시나리오 계산
 * @param {string} teamId          - 분석 대상 팀 ID
 * @param {Array}  teams           - 조 팀 원본 배열
 * @param {Array}  matches         - 조 경기 전체 배열
 * @param {Object} [options]
 * @param {number} [options.advancementSlots=2]  - 직접 진출 슬롯 수
 * @param {number|null} [options.thirdMinPts=4]  - 3위 진출 커트라인 (null이면 3위 진출 없음)
 * @param {Object} [options.standingsOptions]    - calculateStandings에 전달할 options
 * @returns {object|null}
 */
export function runBruteForce(teamId, teams, matches, options = {}) {
  const {
    advancementSlots = 2,
    thirdMinPts = 4,
    standingsOptions = {},
  } = options;

  const remaining = matches.filter(m => !m.played);
  if (remaining.length === 0) return null;

  const teamMatch = remaining.find(m => m.home === teamId || m.away === teamId);
  if (!teamMatch) return null;

  const otherMatch = remaining.find(m => m.id !== teamMatch.id) ?? null;
  const teamIsHome = teamMatch.home === teamId;

  const currentStandings = calculateStandings(teams, matches, standingsOptions);

  const matrix = [];
  const maxRank = teams.length;

  const weightedRankSum = {};
  for (let r = 1; r <= maxRank; r++) weightedRankSum[r] = 0;
  let totalWeight = 0;
  let directAdvanceWeight = 0;
  let thirdAdvancingWeight = 0;
  let bestScenarioWeight = 0;
  let mostLikelyScenario = null;

  for (const teamWDL of ['W', 'D', 'L']) {
    const tPairs = teamScorePairs(teamWDL, teamIsHome);

    for (const otherWDL of ['W', 'D', 'L']) {
      const oPairs = otherMatch ? PAIRS[otherWDL] : [[0, 0, 1]];
      const weightedRankCounts = {};
      for (let r = 1; r <= maxRank; r++) weightedRankCounts[r] = 0;
      let cellWeight = 0;
      const ptsAdjCount = {};

      for (const [th, ta, tw] of tPairs) {
        for (const [oh, oa, ow] of oPairs) {
          const scenarioWeight = tw * ow;

          const testMatches = matches.map(m => {
            if (m.id === teamMatch.id)
              return { ...m, homeScore: String(th), awayScore: String(ta), played: true };
            if (otherMatch && m.id === otherMatch.id)
              return { ...m, homeScore: String(oh), awayScore: String(oa), played: true };
            return m;
          });

          const finalStandings = calculateStandings(teams, testMatches, standingsOptions);
          const rank = finalStandings.findIndex(t => t.id === teamId) + 1;
          const clampedRank = Math.max(1, Math.min(maxRank, rank));
          const myPts = finalStandings.find(t => t.id === teamId)?.pts ?? 0;

          weightedRankCounts[clampedRank] += scenarioWeight;
          cellWeight += scenarioWeight;

          weightedRankSum[clampedRank] += scenarioWeight;
          totalWeight += scenarioWeight;

          // 진출 확률 누산
          if (clampedRank <= advancementSlots) {
            directAdvanceWeight += scenarioWeight;
          } else if (thirdMinPts !== null && clampedRank === advancementSlots + 1) {
            const teamStats = finalStandings.find(t => t.id === teamId);
            if (teamStats && teamStats.pts >= thirdMinPts) {
              thirdAdvancingWeight += scenarioWeight;
            }
          }

          if (scenarioWeight > bestScenarioWeight) {
            bestScenarioWeight = scenarioWeight;
            mostLikelyScenario = {
              teamScore: teamIsHome ? [th, ta] : [ta, th],
              otherScore: otherMatch ? [oh, oa] : null,
              rank: clampedRank,
            };
          }

          for (const other of finalStandings) {
            if (other.id !== teamId && other.pts === myPts) {
              ptsAdjCount[other.id] = (ptsAdjCount[other.id] || 0) + 1;
            }
          }
        }
      }

      const breakdown = Object.entries(weightedRankCounts)
        .filter(([, v]) => v > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => ({
          rank: +k,
          weight: v,
          pct: cellWeight > 0 ? Math.round(v / cellWeight * 100) : 0,
        }));

      let mixedCondition = null;
      if (breakdown.length > 1 && Object.keys(ptsAdjCount).length > 0) {
        const competitorId = Object.entries(ptsAdjCount).sort((a, b) => b[1] - a[1])[0][0];
        mixedCondition = { competitorId };
      }

      matrix.push({
        teamWDL,
        otherWDL,
        weightedRankCounts,
        cellWeight,
        breakdown,
        definitive: breakdown.length === 1 ? breakdown[0].rank : null,
        mixedCondition,
      });
    }
  }

  const rankProbabilities = {};
  for (let r = 1; r <= maxRank; r++) {
    rankProbabilities[r] = totalWeight > 0
      ? Math.round(weightedRankSum[r] / totalWeight * 100)
      : 0;
  }

  const topTwoProbability = totalWeight > 0
    ? Math.round(directAdvanceWeight / totalWeight * 100) : 0;
  const thirdPlaceAdvancingProbability = totalWeight > 0
    ? Math.round(thirdAdvancingWeight / totalWeight * 100) : 0;
  const totalAdvancingProbability = totalWeight > 0
    ? Math.round((directAdvanceWeight + thirdAdvancingWeight) / totalWeight * 100) : 0;

  return {
    teamId,
    teamMatch,
    otherMatch,
    teamIsHome,
    matrix,
    rankProbabilities,
    topTwoProbability,
    thirdPlaceAdvancingProbability,
    totalAdvancingProbability,
    mostLikelyScenario,
    totalWeight,
    currentStandings,
  };
}
