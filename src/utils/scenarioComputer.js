/**
 * FIFA 2026 World Cup 바인딩 shim
 * engine/scenarioComputer.js에 FIFA 기본값을 바인딩하여 기존 인터페이스 유지
 */
import { runBruteForce as _runBruteForce } from '../engine/scenarioComputer.js';

export const THIRD_PLACE_MIN_PTS = 4;

/**
 * @param {string} teamId
 * @param {Array}  teams
 * @param {Array}  matches
 * @param {Object} [options]
 * @param {number} [options.thirdMinPts=4]
 * @param {Function|null} [options.predictor]  - usePredictor 훅이 만든 matchPredictor 클로저. null이면 baseline.
 */
export function runBruteForce(teamId, teams, matches, options = {}) {
  const { thirdMinPts = THIRD_PLACE_MIN_PTS, predictor = null } = options;
  return _runBruteForce(teamId, teams, matches, {
    advancementSlots: 2,
    thirdMinPts,
    matchPredictor: predictor,
  });
}
