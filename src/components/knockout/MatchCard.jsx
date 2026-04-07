import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TeamFlag } from '../scenario/shared.jsx';
import { useTeamName } from '../../i18n/useTeamName.js';

const HIGHLIGHT_RING = {
  '1st': 'ring-2 ring-green-500',
  '2nd': 'ring-2 ring-blue-500',
  '3rd': 'ring-2 ring-yellow-500/70',
};

const HIGHLIGHT_BG = {
  '1st': 'bg-green-900/30',
  '2nd': 'bg-blue-900/30',
  '3rd': 'bg-yellow-900/20',
};

// FIFA 경기 번호 → 라운드별 시작 번호 (라벨은 i18n)
const ROUND_START = { R32: 73, R16: 89, QF: 97, SF: 101 };

// descriptor → 슬롯 라벨 (A1, C2, E3? 등) — locale-neutral
function getSlotLabel(descriptor, match, resolvedTeam) {
  if (!descriptor) return '';
  if (descriptor === '3rd') {
    // 배정된 팀이 있으면 그룹+3 표시, 없으면 가능 그룹 목록
    if (resolvedTeam?.group) return `${resolvedTeam.group}3`;
    return (match.thirdFrom || []).join('/');
  }
  const m = descriptor.match(/^([12])([A-L])$/);
  if (m) return `${m[2]}${m[1]}`;
  return descriptor;
}

function TeamRow({ team, slotLabel, highlight, candidates, side, isThird, confirmed }) {
  const { t } = useTranslation('bracket');
  const teamName = useTeamName();
  const [showPopover, setShowPopover] = useState(false);
  const hasMultipleCandidates = candidates && candidates.length > 1;

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 min-w-0 relative
        ${confirmed ? 'border-l-2 border-green-500' : ''}
        ${highlight ? HIGHLIGHT_BG[highlight] : ''}`}
      onMouseEnter={() => hasMultipleCandidates && setShowPopover(true)}
      onMouseLeave={() => setShowPopover(false)}
    >
      {team ? (
        <>
          <TeamFlag team={team} size="sm" />
          <span className="text-xs font-medium text-white truncate flex-1">{teamName(team)}</span>
          {/* 슬롯 라벨: A1, C2, E3 */}
          <span className={`text-[10px] font-mono shrink-0 ${isThird ? 'text-yellow-400' : 'text-fifa-muted'}`}>
            {slotLabel}
          </span>
        </>
      ) : (
        <>
          <span className="text-[10px] text-fifa-border truncate flex-1">{slotLabel || 'TBD'}</span>
        </>
      )}

      {/* 3위 후보 팝오버 */}
      {showPopover && hasMultipleCandidates && (
        <div className={`absolute z-50 ${side === 'right' ? 'right-full mr-1' : 'left-full ml-1'} top-0 bg-fifa-card border border-fifa-border rounded-lg p-2 shadow-xl min-w-[140px]`}>
          <p className="text-[10px] text-fifa-muted mb-1">{t('match.possibleThirds')}</p>
          {candidates.map((c) => (
            <div key={c.id} className="flex items-center gap-1 py-0.5">
              <TeamFlag team={c} size="sm" />
              <span className="text-xs text-white">{teamName(c)}</span>
              <span className="text-[10px] text-fifa-muted ml-auto">{t('match.groupSuffix', { group: c.group })}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MatchCard({
  match,
  resolvedTeams,
  highlights = [],
  thirdCandidates = {},
  confirmedSlots = {},
  compact = false,
  side = 'left',
}) {
  const { t } = useTranslation('bracket');
  const teams = resolvedTeams?.[match.id];
  const isR32 = match.round === 'R32';

  // 경기 라벨 생성 (i18n)
  const getMatchLabel = (m) => {
    if (m.round === 'FINAL') return t('rounds.FINAL');
    const start = ROUND_START[m.round];
    if (!start) return m.round;
    const num = parseInt(m.id.replace('M', '')) - start + 1;
    return t('matchLabel', { round: t(`rounds.${m.round}`), num });
  };

  // 하이라이트 확인
  const t1Highlight = highlights.find((h) => h.matchId === match.id && h.teamSide === 'team1');
  const t2Highlight = highlights.find((h) => h.matchId === match.id && h.teamSide === 'team2');
  const hasHighlight = t1Highlight || t2Highlight;

  const ringClass = hasHighlight
    ? HIGHLIGHT_RING[t1Highlight?.type || t2Highlight?.type] || ''
    : '';

  // 3위 후보 (matchId 기준)
  const candidates = thirdCandidates[match.id] || null;

  // 슬롯 라벨 + 확정 상태
  const t1SlotLabel = isR32 ? getSlotLabel(match.team1, match, teams?.team1) : null;
  const t2SlotLabel = isR32 ? getSlotLabel(match.team2, match, teams?.team2) : null;
  const slotConf = confirmedSlots[match.id];
  const t1Confirmed = slotConf?.team1Confirmed ?? false;
  const t2Confirmed = slotConf?.team2Confirmed ?? false;

  // 경기 번호 라벨
  const matchLabel = getMatchLabel(match);

  return (
    <div
      className={`rounded-lg border overflow-hidden transition-all
        ${hasHighlight ? `${ringClass} border-transparent` : 'border-fifa-border/50'}
        bg-fifa-card/80`}
      style={{ minWidth: compact ? '120px' : '140px' }}
    >
      {/* 경기 번호 타이틀 */}
      <div className="text-[9px] text-center text-fifa-muted bg-white/5 py-0.5 border-b border-fifa-border/30 font-medium">
        {matchLabel}
      </div>

      <TeamRow
        team={teams?.team1}
        slotLabel={t1SlotLabel || (teams?.team1Label)}
        highlight={t1Highlight?.type}
        candidates={isR32 && match.team1 === '3rd' ? candidates : null}
        side={side}
        isThird={isR32 && match.team1 === '3rd'}
        confirmed={t1Confirmed}
      />
      <div className="border-t border-fifa-border/30" />
      <TeamRow
        team={teams?.team2}
        slotLabel={t2SlotLabel || (teams?.team2Label)}
        highlight={t2Highlight?.type}
        candidates={isR32 && match.team2 === '3rd' ? candidates : null}
        side={side}
        isThird={isR32 && match.team2 === '3rd'}
        confirmed={t2Confirmed}
      />
    </div>
  );
}
