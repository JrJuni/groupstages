/**
 * FIFA 2026 World Cup 바인딩 shim
 * engine/scenarioComputer.js에 FIFA 기본값을 바인딩하여 기존 인터페이스 유지
 */
import { runBruteForce as _runBruteForce } from '../engine/scenarioComputer.js';

export const THIRD_PLACE_MIN_PTS = 4;

export function runBruteForce(teamId, teams, matches, thirdMinPts = THIRD_PLACE_MIN_PTS) {
  return _runBruteForce(teamId, teams, matches, {
    advancementSlots: 2,
    thirdMinPts,
  });
}
