/**
 * FIFA 2026 World Cup 토너먼트 대진표 shim
 */
import { KNOCKOUT_BRACKET } from '../leagues/worldcup2026/data.js';
import { THIRD_PLACE_TABLE } from '../leagues/worldcup2026/thirdPlaceTable.js';
import {
  resolveR32Teams as _resolveR32Teams,
  computeConfirmedSlots as _computeConfirmedSlots,
  computeThirdRange as _computeThirdRange,
  analyzeThirdPlaceCombinations as _analyzeThirdPlaceCombinations,
  getHighlightedMatchIds as _getHighlightedMatchIds,
  getThirdCandidatesPerSlot as _getThirdCandidatesPerSlot,
} from '../engine/knockout.js';

export { KNOCKOUT_BRACKET, THIRD_PLACE_TABLE };

export function resolveR32Teams(allGroupStandings, rankedThirds) {
  return _resolveR32Teams(KNOCKOUT_BRACKET, allGroupStandings, rankedThirds, THIRD_PLACE_TABLE);
}

export function analyzeThirdPlaceCombinations(groups) {
  return _analyzeThirdPlaceCombinations(THIRD_PLACE_TABLE, groups);
}

export function computeThirdRange(teams, matches) {
  return _computeThirdRange(teams, matches);
}

export function computeConfirmedSlots(groups, thirdSlotConfirmed) {
  return _computeConfirmedSlots(KNOCKOUT_BRACKET, groups, thirdSlotConfirmed);
}

export function getHighlightedMatchIds(groupKey, rankedThirds, validKeys) {
  return _getHighlightedMatchIds(KNOCKOUT_BRACKET, groupKey, rankedThirds, validKeys, THIRD_PLACE_TABLE);
}

export function getThirdCandidatesPerSlot(rankedThirds, validKeys) {
  return _getThirdCandidatesPerSlot(KNOCKOUT_BRACKET, rankedThirds, validKeys, THIRD_PLACE_TABLE);
}
