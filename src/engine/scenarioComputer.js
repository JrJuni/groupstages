/**
 * 범용 포아송 가중 브루트포스 시나리오 엔진
 * 진출 슬롯 수, 3위 커트라인 등을 파라미터로 주입
 */
import { calculateStandings } from './rankings.js';

// 포아송 분포 λ=1.4 근사 골 확률 가중치 (0~8골) — predictor 미주입 시 fallback
const GOAL_W = [0.25, 0.35, 0.24, 0.10, 0.04, 0.005, 0.005, 0.005, 0.005];

/**
 * home/away 골 확률 배열로부터 [h, a, w] 페어를 W/D/L로 분류
 * predictor 콜백이 매치별로 다른 PMF를 줄 때 사용
 */
function buildPairsFromWeights(homeW, awayW) {
  const out = { W: [], D: [], L: [] };
  for (let h = 0; h < homeW.length; h++) {
    for (let a = 0; a < awayW.length; a++) {
      const outcome = h > a ? 'W' : h < a ? 'L' : 'D';
      out[outcome].push([h, a, homeW[h] * awayW[a]]);
    }
  }
  return out;
}

// baseline 페어 (predictor 미주입 시 모든 매치에 사용)
const DEFAULT_PAIRS = buildPairsFromWeights(GOAL_W, GOAL_W);

/**
 * 분석 대상 팀 관점의 결과(W/D/L)에 해당하는 페어 추출
 * — 페어는 fixture home/away 좌표이므로, 팀이 away면 W/L를 뒤집는다
 */
function pickTeamPairs(pairs, teamWDL, teamIsHome) {
  if (teamWDL === 'D') return pairs.D;
  if (teamIsHome) return pairs[teamWDL];
  return teamWDL === 'W' ? pairs.L : pairs.W;
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
 * @param {((homeId: string, awayId: string) => {
 *   homeWeights: number[], awayWeights: number[]
 * } | null)} [options.matchPredictor]
 *   매치별 골수 PMF를 반환하는 콜백. 미주입/특정 매치 null 반환 시 baseline GOAL_W로 fallback.
 *   주입되면 매치별로 다른 81셀 페어 그리드가 사용되어 시나리오 확률에 ELO/폼 차이가 반영됨.
 * @returns {object|null}
 */
export function runBruteForce(teamId, teams, matches, options = {}) {
  const {
    advancementSlots = 2,
    thirdMinPts = 4,
    standingsOptions = {},
    matchPredictor = null,
  } = options;

  const remaining = matches.filter(m => !m.played);
  if (remaining.length === 0) return null;

  const teamMatch = remaining.find(m => m.home === teamId || m.away === teamId);
  if (!teamMatch) return null;

  const otherMatch = remaining.find(m => m.id !== teamMatch.id) ?? null;
  const teamIsHome = teamMatch.home === teamId;

  // 매치별 페어 그리드 — predictor 주입 시 ELO/폼 기반, 아니면 baseline GOAL_W
  let teamMatchPairs = DEFAULT_PAIRS;
  let otherMatchPairs = DEFAULT_PAIRS;
  if (matchPredictor) {
    const teamPred = matchPredictor(teamMatch.home, teamMatch.away);
    if (teamPred) {
      teamMatchPairs = buildPairsFromWeights(teamPred.homeWeights, teamPred.awayWeights);
    }
    if (otherMatch) {
      const otherPred = matchPredictor(otherMatch.home, otherMatch.away);
      if (otherPred) {
        otherMatchPairs = buildPairsFromWeights(otherPred.homeWeights, otherPred.awayWeights);
      }
    }
  }

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
    const tPairs = pickTeamPairs(teamMatchPairs, teamWDL, teamIsHome);

    for (const otherWDL of ['W', 'D', 'L']) {
      const oPairs = otherMatch ? otherMatchPairs[otherWDL] : [[0, 0, 1]];
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
