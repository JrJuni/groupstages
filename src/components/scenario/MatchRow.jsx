import React from 'react';
import { MapPin } from 'lucide-react';
import { formatKST, TeamFlag } from './shared.jsx';

function MatchRow({ match, standings, onScoreChange, highlightId }) {
  const homeTeam = standings.find((t) => t.id === match.home);
  const awayTeam = standings.find((t) => t.id === match.away);
  if (!homeTeam || !awayTeam) return null;

  const played = match.homeScore !== null && match.homeScore !== undefined &&
                 match.homeScore !== '' && match.awayScore !== null &&
                 match.awayScore !== undefined && match.awayScore !== '';

  const dateStr = formatKST(match.date);
  const isRelevant = highlightId && (match.home === highlightId || match.away === highlightId);

  return (
    <div className={`border-b border-fifa-border/20 last:border-0 ${played ? '' : 'opacity-80'} ${isRelevant ? 'bg-sky-400/5' : ''}`}>
      {dateStr && (
        <div className="flex items-center gap-2 px-4 pt-2 pb-0.5">
          <span className="text-[10px] text-fifa-gold font-medium">{dateStr}</span>
          {match.city && (
            <span className="flex items-center gap-0.5 text-[10px] text-fifa-muted">
              <MapPin size={9} />
              {match.city}
            </span>
          )}
          {isRelevant && !played && (
            <span className="ml-auto text-[9px] bg-sky-400/15 text-sky-400 px-1.5 py-0.5 rounded-full">관련 경기</span>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 py-2 px-4 text-sm">
        <div className="flex items-center gap-1.5 flex-1 justify-end">
          <span className={`text-xs sm:text-sm whitespace-nowrap hidden sm:inline ${match.home === highlightId ? 'text-sky-400 font-bold' : 'text-white'}`}>{homeTeam.name}</span>
          <TeamFlag team={homeTeam} />
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {played ? (
            <div className="flex items-center gap-1 bg-white/10 rounded px-3 py-1">
              <span className="font-bold text-white text-base w-5 text-right">{match.homeScore}</span>
              <span className="text-fifa-muted text-xs">:</span>
              <span className="font-bold text-white text-base w-5 text-left">{match.awayScore}</span>
            </div>
          ) : (
            <>
              <input
                type="number"
                min="0"
                max="99"
                className="score-input"
                value={match.homeScore ?? ''}
                onChange={(e) => onScoreChange(match.id, 'homeScore', e.target.value)}
                placeholder="-"
              />
              <span className="text-fifa-muted text-xs">:</span>
              <input
                type="number"
                min="0"
                max="99"
                className="score-input"
                value={match.awayScore ?? ''}
                onChange={(e) => onScoreChange(match.id, 'awayScore', e.target.value)}
                placeholder="-"
              />
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-1 justify-start">
          <TeamFlag team={awayTeam} />
          <span className={`text-xs sm:text-sm whitespace-nowrap hidden sm:inline ${match.away === highlightId ? 'text-sky-400 font-bold' : 'text-white'}`}>{awayTeam.name}</span>
        </div>
      </div>
    </div>
  );
}

export function MatchList({ matches, standings, groupKey, onScoreChange, highlightId }) {
  if (!matches?.length) return null;

  const sorted = [...matches].sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(a.date) - new Date(b.date);
  });

  let lastMatchday = null;
  const rows = [];
  sorted.forEach((match) => {
    const md = match.matchday;
    if (md && md !== lastMatchday) {
      rows.push(
        <div key={`md-${md}`} className="flex items-center gap-2 px-4 py-1.5 bg-white/5 border-b border-fifa-border/30">
          <span className="text-[10px] font-bold text-fifa-muted uppercase tracking-wider">
            경기일 {md}
          </span>
        </div>
      );
      lastMatchday = md;
    }
    rows.push(
      <MatchRow
        key={match.id}
        match={match}
        standings={standings}
        highlightId={highlightId}
        onScoreChange={(matchId, field, value) =>
          onScoreChange(groupKey, matchId, field, value)
        }
      />
    );
  });

  return <div className="card overflow-hidden">{rows}</div>;
}

export default MatchRow;
