import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy } from 'lucide-react';
import { TeamFlag } from './shared.jsx';
import {
  KNOCKOUT_BRACKET,
  THIRD_PLACE_TABLE,
} from '../../utils/knockout.js';
import { computeAllGroupRankPossibilities } from '../../utils/groupRankPossibilities.js';
import { useTeamName } from '../../i18n/useTeamName.js';

// 슬롯에 올 수 있는 후보팀 산정
function resolveCandidates(opponentDesc, opponentThirdFrom, matchId, ctx) {
  const { allRankPossibilities, allGroupStandings, validKeys } = ctx;
  if (!opponentDesc) return [];

  // 직접 진출 슬롯 (1Y, 2Y)
  const direct = opponentDesc.match(/^([12])([A-L])$/);
  if (direct) {
    const rank = parseInt(direct[1], 10);
    const group = direct[2];
    const standings = allGroupStandings[group] || [];
    const rankPoss = allRankPossibilities[group] || {};
    return standings
      .filter((t) => rankPoss[t.id]?.has(rank))
      .map((t) => ({ ...t, _group: group }));
  }

  // 3위 슬롯: 유효 조합에서 이 matchId에 배정될 수 있는 그룹들
  if (opponentDesc === '3rd') {
    const possibleGroups = new Set();
    for (const k of validKeys || []) {
      const g = THIRD_PLACE_TABLE[k]?.[matchId];
      if (g) possibleGroups.add(g);
    }
    const out = [];
    const seen = new Set();
    for (const g of possibleGroups) {
      const standings = allGroupStandings[g] || [];
      const rankPoss = allRankPossibilities[g] || {};
      for (const t of standings) {
        if (rankPoss[t.id]?.has(3) && !seen.has(t.id)) {
          seen.add(t.id);
          out.push({ ...t, _group: g });
        }
      }
    }
    return out;
  }

  return [];
}

export default function R32MatchupPreview({
  team,
  groupKey,
  groups,
  allGroupStandings,
  thirdAnalysis,
}) {
  const { t } = useTranslation('scenario');
  const teamName = useTeamName();

  // 슬롯 디스크립터(예: '1A', '2C', '3rd')를 i18n 라벨로 변환
  const describeDescriptor = (desc, thirdFrom) => {
    if (!desc) return '';
    if (desc === '3rd') {
      return t('r32.slot.third', { groups: (thirdFrom || []).join('/') });
    }
    const m = desc.match(/^([12])([A-L])$/);
    if (m) {
      return t('r32.slot.direct', { group: m[2], rank: t(`r32.rankLabels.${m[1]}`) });
    }
    return desc;
  };

  // 모든 조의 랭크 가능성 (한 번만 계산, groups 변경 시에만 갱신)
  const allRankPossibilities = useMemo(
    () => computeAllGroupRankPossibilities(groups),
    [groups]
  );

  const myRanks = allRankPossibilities[groupKey]?.[team.id] || new Set();

  const scenarios = useMemo(() => {
    const out = [];
    const ctx = {
      allRankPossibilities,
      allGroupStandings,
      validKeys: thirdAnalysis?.validKeys || [],
    };

    const buildSlot = (match, mySide) => {
      const oppSide = mySide === 'team1' ? 'team2' : 'team1';
      const oppDesc = match[oppSide];
      const candidates = resolveCandidates(oppDesc, match.thirdFrom, match.id, ctx);
      return {
        matchId: match.id,
        opponentLabel: describeDescriptor(oppDesc, match.thirdFrom),
        candidates,
      };
    };

    // 1위, 2위: 단일 슬롯
    for (const rank of [1, 2]) {
      if (!myRanks.has(rank)) continue;
      const desc = `${rank}${groupKey}`;
      let found = null;
      for (const m of KNOCKOUT_BRACKET) {
        if (m.round !== 'R32') continue;
        if (m.team1 === desc) { found = { match: m, mySide: 'team1' }; break; }
        if (m.team2 === desc) { found = { match: m, mySide: 'team2' }; break; }
      }
      if (found) {
        out.push({ rank, slots: [buildSlot(found.match, found.mySide)] });
      }
    }

    // 3위: validKeys + THIRD_PLACE_TABLE 기반 다중 슬롯
    if (myRanks.has(3) && !thirdAnalysis?.eliminatedGroups?.has(groupKey)) {
      const possibleMatchIds = new Set();
      for (const k of thirdAnalysis?.validKeys || []) {
        if (!k.includes(groupKey)) continue;
        const entry = THIRD_PLACE_TABLE[k];
        if (!entry) continue;
        for (const [mId, g] of Object.entries(entry)) {
          if (g === groupKey) possibleMatchIds.add(mId);
        }
      }
      const slots = [];
      for (const mId of possibleMatchIds) {
        const m = KNOCKOUT_BRACKET.find((b) => b.id === mId);
        if (!m) continue;
        const mySide = m.team1 === '3rd' ? 'team1' : 'team2';
        slots.push(buildSlot(m, mySide));
      }
      // 슬롯을 matchId 순으로 안정 정렬
      slots.sort((a, b) => a.matchId.localeCompare(b.matchId));
      if (slots.length > 0) out.push({ rank: 3, slots });
    }

    return out;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team.id, groupKey, myRanks, allRankPossibilities, allGroupStandings, thirdAnalysis, t]);

  if (scenarios.length === 0) return null;

  const rankLabel = (r) => t(`r32.rankLabels.${r}`);
  const rankColor = (r) =>
    r === 1 ? 'text-emerald-300' : r === 2 ? 'text-green-300' : 'text-yellow-300';

  return (
    <div className="mt-3 pt-3 border-t border-fifa-border/30">
      <p className="text-xs font-medium text-fifa-muted mb-2 flex items-center gap-1">
        <Trophy size={11} />
        {t('r32.title')}
      </p>
      <div className="space-y-2">
        {scenarios.map((s) => (
          <div
            key={s.rank}
            className="rounded-md bg-white/5 border border-fifa-border/20 px-3 py-2"
          >
            {(scenarios.length > 1 || s.slots.length > 1) && (
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                {scenarios.length > 1 && (
                  <span className={`text-[11px] font-bold ${rankColor(s.rank)}`}>
                    {t('r32.ifAdvance', { group: groupKey, rank: rankLabel(s.rank) })}
                  </span>
                )}
                {s.slots.length > 1 && (
                  <span className="text-[10px] text-fifa-muted/70">
                    {t('r32.oneOf')}
                  </span>
                )}
              </div>
            )}
            <div className="space-y-2">
              {s.slots.map((slot) => (
                <div key={slot.matchId} className="text-xs">
                  <div className="flex items-center gap-1.5 text-fifa-muted">
                    <span>{t('r32.vs')}</span>
                    <span className="text-white font-medium">
                      {slot.opponentLabel}
                    </span>
                    <span className="text-fifa-muted/50 text-[10px]">
                      ({slot.matchId})
                    </span>
                  </div>
                  {slot.candidates.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mt-1 pl-4">
                      {slot.candidates.map((c) => (
                        <span
                          key={`${c.id}-${c._group || ''}`}
                          className="inline-flex items-center gap-1 bg-white/5 rounded px-1.5 py-0.5"
                        >
                          <TeamFlag team={c} />
                          <span className="text-white text-[11px]">{teamName(c)}</span>
                          {c._group && (
                            <span className="text-fifa-muted/60 text-[9px]">
                              ({c._group})
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-fifa-muted/60 mt-1 pl-4">
                      {t('r32.noCandidates')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
