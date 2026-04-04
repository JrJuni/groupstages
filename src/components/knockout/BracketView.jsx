import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import BracketSide from './BracketSide.jsx';
import MatchCard from './MatchCard.jsx';

const ROUND_LABELS = { R32: '32강', R16: '16강', QF: '8강', SF: '4강', FINAL: '결승' };
const MOBILE_ROUND_ORDER = ['R32', 'R16', 'QF', 'SF', 'FINAL'];

function MobileRoundSection({
  roundName,
  matches,
  resolvedTeams,
  highlights,
  thirdCandidates,
  confirmedSlots,
  defaultCollapsed = false,
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const Icon = collapsed ? ChevronDown : ChevronUp;

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm font-bold text-white hover:bg-white/5"
      >
        <span>{ROUND_LABELS[roundName]} ({matches.length}경기)</span>
        <Icon size={14} className="text-fifa-muted" />
      </button>
      {!collapsed && (
        <div className="px-3 pb-3 grid grid-cols-2 gap-2">
          {matches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              resolvedTeams={resolvedTeams}
              highlights={highlights}
              thirdCandidates={thirdCandidates}
              confirmedSlots={confirmedSlots}
              side="left"
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function BracketView({
  bracket,
  resolvedTeams,
  highlights,
  thirdCandidates,
  confirmedSlots,
}) {
  const finalMatch = bracket.find((m) => m.round === 'FINAL');

  return (
    <>
      {/* ── 데스크탑: 수평 브래킷 ── */}
      <div className="hidden lg:flex gap-0 items-stretch" style={{ minHeight: '700px' }}>
        <BracketSide
          side="left"
          bracket={bracket}
          resolvedTeams={resolvedTeams}
          highlights={highlights}
          thirdCandidates={thirdCandidates}
          confirmedSlots={confirmedSlots}
        />

        <div className="flex flex-col justify-center px-2 min-w-[140px]">
          <div className="text-[10px] text-center text-fifa-gold font-bold mb-1">
            🏆 결승
          </div>
          {finalMatch && (
            <MatchCard
              match={finalMatch}
              resolvedTeams={resolvedTeams}
              highlights={highlights}
              thirdCandidates={thirdCandidates}
              confirmedSlots={confirmedSlots}
              side="left"
            />
          )}
        </div>

        <BracketSide
          side="right"
          bracket={bracket}
          resolvedTeams={resolvedTeams}
          highlights={highlights}
          thirdCandidates={thirdCandidates}
          confirmedSlots={confirmedSlots}
        />
      </div>

      {/* ── 모바일: 수직 리스트 ── */}
      <div className="lg:hidden space-y-2">
        {MOBILE_ROUND_ORDER.map((roundName) => {
          const matches = bracket
            .filter((m) => m.round === roundName)
            .sort((a, b) => {
              if (a.side !== b.side) return a.side === 'left' ? -1 : 1;
              return a.pos - b.pos;
            });

          return (
            <MobileRoundSection
              key={roundName}
              roundName={roundName}
              matches={matches}
              resolvedTeams={resolvedTeams}
              highlights={highlights}
              thirdCandidates={thirdCandidates}
              confirmedSlots={confirmedSlots}
              defaultCollapsed={roundName === 'R32'}
            />
          );
        })}
      </div>
    </>
  );
}
