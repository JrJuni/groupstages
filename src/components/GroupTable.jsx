import React from 'react';
import { ArrowRight } from 'lucide-react';
import { BASE_URL } from '../config.js';

const RANK_BG = {
  1: 'bg-green-900/40 border-l-2 border-green-500',
  2: 'bg-green-900/20 border-l-2 border-green-700',
  3: 'bg-yellow-900/20 border-l-2 border-yellow-600',
  4: 'bg-transparent',
};

export default function GroupTable({ groupKey, standings, onGroupClick, onTeamClick }) {
  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-fifa-blue/20 border-b border-fifa-border">
        <button
          className="flex items-center gap-2 group hover:opacity-80 transition-opacity text-left min-w-0"
          onClick={() => onGroupClick && onGroupClick(groupKey)}
          title={`조 ${groupKey} 경우의 수 보기`}
        >
          <span className="font-bold text-lg text-white shrink-0">조 {groupKey}</span>
          <div className="flex gap-1 items-center shrink-0">
            {standings.map((t) => (
              t.flagImg
                ? <img key={t.id} src={`${BASE_URL}${t.flagImg}`} alt={t.name} title={t.name} className="w-5 h-3 object-cover rounded-sm" />
                : <span key={t.id} className="text-sm" title={t.name}>{t.flag}</span>
            ))}
          </div>
          <ArrowRight size={12} className="text-fifa-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </button>
      </div>

      <table className="w-full text-sm table-fixed">
        <colgroup>
          <col style={{ width: '28px' }} />
          <col />
          <col style={{ width: '34px' }} />
          <col style={{ width: '26px' }} />
          <col style={{ width: '26px' }} />
          <col style={{ width: '26px' }} />
          <col style={{ width: '26px' }} />
          <col style={{ width: '26px' }} />
          <col style={{ width: '34px' }} />
          <col style={{ width: '36px' }} />
        </colgroup>
        <thead>
          <tr className="text-fifa-muted text-xs border-b border-fifa-border">
            <th className="px-1 py-2 text-left">#</th>
            <th className="px-2 py-2 text-left">팀</th>
            <th className="px-1 py-2 text-center whitespace-nowrap">경기</th>
            <th className="px-1 py-2 text-center">승</th>
            <th className="px-1 py-2 text-center">무</th>
            <th className="px-1 py-2 text-center">패</th>
            <th className="px-1 py-2 text-center">득</th>
            <th className="px-1 py-2 text-center">실</th>
            <th className="px-1 py-2 text-center">차</th>
            <th className="px-1 py-2 text-center font-bold">승점</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((team, idx) => (
            <tr
              key={team.id}
              className={`border-b border-fifa-border/30 transition-colors cursor-pointer hover:bg-white/10 ${RANK_BG[idx + 1] || ''}`}
              onClick={() => onTeamClick && onTeamClick(team.id, groupKey)}
              title={`${team.name} 경우의 수 보기`}
            >
              <td className="px-1 py-2 text-fifa-muted text-xs text-center">{idx + 1}</td>
              <td className="px-2 py-2 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  {team.flagImg ? (
                    <img src={`${BASE_URL}${team.flagImg}`} alt={team.name} className="w-5 h-3.5 object-cover rounded-sm shrink-0"
                      onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'inline'; }} />
                  ) : null}
                  <span className="text-sm shrink-0" style={team.flagImg ? { display: 'none' } : {}}>{team.flag}</span>
                  <span className="font-medium text-white text-xs truncate">{team.name}</span>
                  {team.host && (
                    <span className="shrink-0 text-[10px] bg-fifa-gold/20 text-fifa-gold px-1 rounded">H</span>
                  )}
                </div>
              </td>
              <td className="px-1 py-2 text-center text-xs text-fifa-muted">{team.played}</td>
              <td className="px-1 py-2 text-center text-xs text-green-400">{team.won}</td>
              <td className="px-1 py-2 text-center text-xs">{team.drawn}</td>
              <td className="px-1 py-2 text-center text-xs text-red-400">{team.lost}</td>
              <td className="px-1 py-2 text-center text-xs">{team.gf}</td>
              <td className="px-1 py-2 text-center text-xs">{team.ga}</td>
              <td className={`px-1 py-2 text-center text-xs ${team.gd > 0 ? 'text-green-400' : team.gd < 0 ? 'text-red-400' : ''}`}>
                {team.gd > 0 ? `+${team.gd}` : team.gd}
              </td>
              <td className="px-1 py-2 text-center text-xs font-bold text-white">{team.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
