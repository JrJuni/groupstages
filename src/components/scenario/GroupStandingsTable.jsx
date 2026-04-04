import React from 'react';
import { ChevronRight } from 'lucide-react';
import { getFairPlayPoints } from '../../utils/rankings.js';
import { RANK_BG, TeamFlag, YellowCard, DoubleYellowCard, RedCard } from './shared.jsx';

export default function GroupStandingsTable({ standings, highlightId, onTeamClick }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-fifa-border/40">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-fifa-muted text-[11px] border-b border-fifa-border bg-white/5">
            <th className="px-2 py-2 text-left w-5">#</th>
            <th className="px-2 py-2 text-left">팀</th>
            <th className="px-1 py-2 text-center">경기</th>
            <th className="px-1 py-2 text-center">승</th>
            <th className="px-1 py-2 text-center">무</th>
            <th className="px-1 py-2 text-center">패</th>
            <th className="px-1 py-2 text-center">득</th>
            <th className="px-1 py-2 text-center">실</th>
            <th className="px-1 py-2 text-center">차</th>
            <th className="px-1 py-2 text-center font-bold">승점</th>
            <th className="px-1 py-2 text-center" title="옐로카드 (-1점)"><YellowCard /></th>
            <th className="px-1 py-2 text-center" title="옐로 누적 퇴장 (-3점)"><DoubleYellowCard /></th>
            <th className="px-1 py-2 text-center" title="직접 퇴장 레드카드 (-4점)"><RedCard /></th>
            <th className="px-1 py-2 text-center text-[10px] text-fifa-muted" title="페어플레이 포인트">FP</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((team, idx) => {
            const fp = getFairPlayPoints(team);
            const isHighlighted = team.id === highlightId;
            return (
              <tr
                key={team.id}
                className={`border-b border-fifa-border/30 ${RANK_BG[idx + 1] || ''} ${isHighlighted ? 'ring-1 ring-inset ring-sky-400/60' : ''}`}
              >
                <td className="px-2 py-1.5 text-fifa-muted">{idx + 1}</td>
                <td className="px-2 py-1.5">
                  <button
                    onClick={() => onTeamClick?.(team.id)}
                    className={`flex items-center gap-1.5 text-left group hover:opacity-80 transition-opacity ${isHighlighted ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    <TeamFlag team={team} />
                    <span className={`font-medium whitespace-nowrap ${isHighlighted ? 'text-sky-400' : 'text-white group-hover:text-sky-300'}`}>{team.name}</span>
                    {team.host && (
                      <span className="text-[9px] bg-fifa-gold/20 text-fifa-gold px-1 rounded">H</span>
                    )}
                    {isHighlighted && <ChevronRight size={10} className="text-sky-400 shrink-0" />}
                  </button>
                </td>
                <td className="px-1 py-1.5 text-center text-fifa-muted">{team.played}</td>
                <td className="px-1 py-1.5 text-center text-green-400">{team.won}</td>
                <td className="px-1 py-1.5 text-center">{team.drawn}</td>
                <td className="px-1 py-1.5 text-center text-red-400">{team.lost}</td>
                <td className="px-1 py-1.5 text-center">{team.gf}</td>
                <td className="px-1 py-1.5 text-center">{team.ga}</td>
                <td className={`px-1 py-1.5 text-center ${team.gd > 0 ? 'text-green-400' : team.gd < 0 ? 'text-red-400' : ''}`}>
                  {team.gd > 0 ? `+${team.gd}` : team.gd}
                </td>
                <td className="px-1 py-1.5 text-center font-bold text-white">{team.pts}</td>
                <td className="px-1 py-1.5 text-center text-yellow-400">{team.yc || 0}</td>
                <td className="px-1 py-1.5 text-center text-orange-400">{team.twoYR || 0}</td>
                <td className="px-1 py-1.5 text-center text-red-400">{team.dr || 0}</td>
                <td className={`px-1 py-1.5 text-center font-bold ${fp < 0 ? 'text-red-400' : 'text-fifa-muted'}`}>
                  {fp}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
