import React, { useState, useMemo } from 'react';
import GroupSelector from './GroupSelector.jsx';
import BracketView from './BracketView.jsx';
import {
  KNOCKOUT_BRACKET,
  resolveR32Teams,
  computeConfirmedSlots,
  getHighlightedMatchIds,
  getThirdCandidatesPerSlot,
} from '../../utils/knockout.js';

export default function BracketPage({ groups, allGroupStandings, best8, thirdAnalysis }) {
  const [highlightedGroup, setHighlightedGroup] = useState(null);

  // best8에 group 정보 보장
  const rankedThirds = useMemo(() =>
    best8.map((t) => {
      if (t.group) return t;
      for (const [g, standings] of Object.entries(allGroupStandings)) {
        if (standings[2]?.id === t.id) return { ...t, group: g };
      }
      return t;
    }),
    [best8, allGroupStandings]
  );

  // R32 슬롯 → 실제 팀 매핑
  const resolvedTeams = useMemo(
    () => resolveR32Teams(allGroupStandings, rankedThirds),
    [allGroupStandings, rankedThirds]
  );

  // 확정 슬롯 계산 (thirdAnalysis에서 3위 슬롯 확정 정보 사용)
  const confirmedSlots = useMemo(
    () => computeConfirmedSlots(groups, thirdAnalysis.slotConfirmed),
    [groups, thirdAnalysis.slotConfirmed]
  );

  // 3위 슬롯별 후보 팀 (유효 조합 기반 필터링)
  const thirdCandidates = useMemo(
    () => getThirdCandidatesPerSlot(rankedThirds, thirdAnalysis.validKeys),
    [rankedThirds, thirdAnalysis]
  );

  // 그룹 클릭 시 하이라이트 (유효 조합 기반)
  const highlights = useMemo(() => {
    if (!highlightedGroup) return [];
    return getHighlightedMatchIds(highlightedGroup, rankedThirds, thirdAnalysis.validKeys);
  }, [highlightedGroup, rankedThirds, thirdAnalysis]);

  // 선택된 그룹 정보
  const selectedGroupInfo = useMemo(() => {
    if (!highlightedGroup) return null;
    const standings = allGroupStandings[highlightedGroup];
    if (!standings || standings.length < 3) return null;

    const third = standings[2];
    const isInBest8 = rankedThirds.some((t) => t.group === highlightedGroup);
    const thirdRank = rankedThirds.findIndex((t) => t.group === highlightedGroup) + 1;

    return {
      first: standings[0], second: standings[1], third,
      isInBest8, thirdRank: isInBest8 ? thirdRank : null,
      isEliminated: thirdAnalysis.eliminatedGroups.has(highlightedGroup),
      isQualified: thirdAnalysis.qualifiedGroups.has(highlightedGroup),
    };
  }, [highlightedGroup, allGroupStandings, rankedThirds, thirdAnalysis]);

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <GroupSelector selected={highlightedGroup} onSelect={setHighlightedGroup} />
          <span className="text-[10px] text-fifa-muted">
            유효 조합: {thirdAnalysis.validKeys.length}/495
          </span>
        </div>

        {selectedGroupInfo && (
          <div className="mt-3 pt-3 border-t border-fifa-border/30 flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-green-400 font-medium">1위</span>
              <span className="text-white">{selectedGroupInfo.first?.name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-blue-400 font-medium">2위</span>
              <span className="text-white">{selectedGroupInfo.second?.name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-yellow-400 font-medium">3위</span>
              <span className="text-white">{selectedGroupInfo.third?.name}</span>
              <span className="text-fifa-muted">
                {selectedGroupInfo.isEliminated ? '(탈락 확정)'
                  : selectedGroupInfo.isQualified ? '(진출 확정)'
                  : selectedGroupInfo.isInBest8 ? `(현재 3위 ${selectedGroupInfo.thirdRank}위)`
                  : '(현재 탈락권)'}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 text-[10px] text-fifa-muted px-1">
        <span className="flex items-center gap-1">
          <span className="w-3 h-2 rounded border-2 border-green-500 inline-block" />
          1위 진출 위치
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-2 rounded border-2 border-blue-500 inline-block" />
          2위 진출 위치
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-2 rounded border-2 border-yellow-500/70 inline-block" style={{ borderStyle: 'dashed' }} />
          3위 가능 위치
        </span>
        <span className="flex items-center gap-1">
          <span className="w-0.5 h-3 bg-green-500 rounded-full inline-block" />
          슬롯 확정
        </span>
      </div>

      <BracketView
        bracket={KNOCKOUT_BRACKET}
        resolvedTeams={resolvedTeams}
        highlights={highlights}
        thirdCandidates={thirdCandidates}
        confirmedSlots={confirmedSlots}
      />
    </div>
  );
}
