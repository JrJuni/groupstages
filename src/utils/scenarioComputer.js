import { calculateStandings } from './rankings.js';

// 포아송 분포 λ=1.4 근사 골 확률 가중치 (0~8골)
// 합계: 0.25+0.35+0.24+0.10+0.04 = 0.98, 5~8골은 0.02를 4등분 → 총합 1.00
const GOAL_W = [0.25, 0.35, 0.24, 0.10, 0.04, 0.005, 0.005, 0.005, 0.005];

// 0~8 스코어 조합 사전 분류: [homeGoals, awayGoals, weight]
// W: 홈승(h>a), D: 무승부(h=a), L: 원정승(h<a)
const PAIRS = { W: [], D: [], L: [] };
for (let h = 0; h <= 8; h++) {
  for (let a = 0; a <= 8; a++) {
    const outcome = h > a ? 'W' : h < a ? 'L' : 'D';
    PAIRS[outcome].push([h, a, GOAL_W[h] * GOAL_W[a]]);
  }
}

/**
 * 팀 관점 W/D/L → [homeGoals, awayGoals, weight] 배열 반환
 * teamIsHome: 분석 대상 팀이 홈팀인지 여부
 */
function teamScorePairs(teamWDL, teamIsHome) {
  if (teamWDL === 'D') return PAIRS.D;
  if (teamIsHome) return PAIRS[teamWDL];
  return teamWDL === 'W' ? PAIRS.L : PAIRS.W;
}

// 2026 WC: 조 3위 중 상위 8팀 진출 — 기본 커트라인 승점 4
export const THIRD_PLACE_MIN_PTS = 4;

/**
 * 포아송 가중 브루트포스 시나리오 계산
 * @param {string} teamId      - 분석 대상 팀 ID
 * @param {Array}  teams       - 조 팀 원본 배열 (카드 데이터 포함)
 * @param {Array}  matches     - 조 경기 전체 배열 (played/unplayed 모두)
 * @param {number} thirdMinPts - 3위 진출 커트라인 (기본값: 4)
 * @returns {object|null}
 */
export function runBruteForce(teamId, teams, matches, thirdMinPts = THIRD_PLACE_MIN_PTS) {
  const remaining = matches.filter(m => !m.played);
  if (remaining.length === 0) return null;

  const teamMatch = remaining.find(m => m.home === teamId || m.away === teamId);
  if (!teamMatch) return null;

  const otherMatch = remaining.find(m => m.id !== teamMatch.id) ?? null;
  const teamIsHome = teamMatch.home === teamId;

  // 현재 순위표 (경기 전 기준) — 혼조 분석에 사용
  const currentStandings = calculateStandings(teams, matches);

  const matrix = [];

  // 전체 가중치 누산기
  const weightedRankSum = { 1: 0, 2: 0, 3: 0, 4: 0 };
  let totalWeight = 0;
  let topTwoWeight = 0;
  let thirdAdvancingWeight = 0;
  let bestScenarioWeight = 0;
  let mostLikelyScenario = null;

  for (const teamWDL of ['W', 'D', 'L']) {
    const tPairs = teamScorePairs(teamWDL, teamIsHome);

    for (const otherWDL of ['W', 'D', 'L']) {
      // otherMatch 없을 때 더미 페어 [0,0,1] — 정규화 시 상쇄됨
      const oPairs = otherMatch ? PAIRS[otherWDL] : [[0, 0, 1]];
      const weightedRankCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
      let cellWeight = 0;
      // 혼조 분석: 이 셀에서 승점이 동률인 경쟁 팀 추적
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

          const finalStandings = calculateStandings(teams, testMatches);
          const rank = finalStandings.findIndex(t => t.id === teamId) + 1;
          const clampedRank = Math.max(1, Math.min(4, rank));
          const myPts = finalStandings.find(t => t.id === teamId)?.pts ?? 0;

          weightedRankCounts[clampedRank] += scenarioWeight;
          cellWeight += scenarioWeight;

          // 전체 누산
          weightedRankSum[clampedRank] += scenarioWeight;
          totalWeight += scenarioWeight;

          // 진출 확률 누산
          if (clampedRank <= 2) {
            topTwoWeight += scenarioWeight;
          } else if (clampedRank === 3) {
            const teamStats = finalStandings.find(t => t.id === teamId);
            if (teamStats && teamStats.pts >= thirdMinPts) {
              thirdAdvancingWeight += scenarioWeight;
            }
          }

          // 최빈 시나리오 추적 (셀 단위 비교)
          if (scenarioWeight > bestScenarioWeight) {
            bestScenarioWeight = scenarioWeight;
            mostLikelyScenario = {
              teamScore: teamIsHome ? [th, ta] : [ta, th],
              otherScore: otherMatch ? [oh, oa] : null,
              rank: clampedRank,
            };
          }

          // 혼조 분석: 승점 동률 팀 카운트
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

      // 혼조 셀: 주요 경쟁 팀 (승점 동률 가장 빈번한 팀)
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

  // 전체 순위 확률 (%)
  const rankProbabilities = {};
  [1, 2, 3, 4].forEach(r => {
    rankProbabilities[r] = totalWeight > 0
      ? Math.round(weightedRankSum[r] / totalWeight * 100)
      : 0;
  });

  const topTwoProbability = totalWeight > 0
    ? Math.round(topTwoWeight / totalWeight * 100) : 0;
  const thirdPlaceAdvancingProbability = totalWeight > 0
    ? Math.round(thirdAdvancingWeight / totalWeight * 100) : 0;
  const totalAdvancingProbability = totalWeight > 0
    ? Math.round((topTwoWeight + thirdAdvancingWeight) / totalWeight * 100) : 0;

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
