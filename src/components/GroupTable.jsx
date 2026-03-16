import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';

const RANK_BG = {
  1: 'bg-green-900/40 border-l-2 border-green-500',
  2: 'bg-green-900/20 border-l-2 border-green-700',
  3: 'bg-yellow-900/20 border-l-2 border-yellow-600',
  4: 'bg-transparent',
};

export default function GroupTable({ groupKey, standings, onGroupClick, onTeamClick }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-fifa-blue/20 border-b border-fifa-border">
        {/* 왼쪽: 조 이름 + 국기 (클릭 → 경우의 수 탭) */}
        <button
          className="flex items-center gap-2 group hover:opacity-80 transition-opacity text-left"
          onClick={() => onGroupClick && onGroupClick(groupKey)}
          title={`조 ${groupKey} 경우의 수 보기`}
        >
          <span className="font-bold text-lg text-white">조 {groupKey}</span>
          <div className="flex gap-1 items-center">
            {standings.map((t) => (
              t.flagImg
                ? <img key={t.id} src={t.flagImg} alt={t.name} title={t.name} className="w-5 h-3 object-cover rounded-sm" />
                : <span key={t.id} className="text-sm" title={t.name}>{t.flag}</span>
            ))}
          </div>
          <ArrowRight size={12} className="text-fifa-muted opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        {/* 오른쪽: 접기/펼치기 버튼 */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="p-1 text-fifa-muted hover:text-white transition-colors"
        >
          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>

      {!collapsed && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-fifa-muted text-xs border-b border-fifa-border">
                <th className="px-3 py-2 text-left w-6">#</th>
                <th className="px-3 py-2 text-left">팀</th>
                <th className="px-2 py-2 text-center">경</th>
                <th className="px-2 py-2 text-center">승</th>
                <th className="px-2 py-2 text-center">무</th>
                <th className="px-2 py-2 text-center">패</th>
                <th className="px-2 py-2 text-center">득</th>
                <th className="px-2 py-2 text-center">실</th>
                <th className="px-2 py-2 text-center">차</th>
                <th className="px-2 py-2 text-center font-bold">승점</th>
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
                  <td className="px-3 py-2 text-fifa-muted text-xs">{idx + 1}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {team.flagImg ? (
                        <img src={team.flagImg} alt={team.name} className="w-6 h-4 object-cover rounded-sm" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='inline'; }} />
                      ) : null}
                      <span className="text-base" style={team.flagImg ? {display:'none'} : {}}>{team.flag}</span>
                      <span className="font-medium text-white text-xs sm:text-sm whitespace-nowrap">{team.name}</span>
                      {team.host && (
                        <span className="hidden sm:inline text-xs bg-fifa-gold/20 text-fifa-gold px-1 rounded">H</span>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-2 text-center text-fifa-muted">{team.played}</td>
                  <td className="px-2 py-2 text-center text-green-400">{team.won}</td>
                  <td className="px-2 py-2 text-center">{team.drawn}</td>
                  <td className="px-2 py-2 text-center text-red-400">{team.lost}</td>
                  <td className="px-2 py-2 text-center">{team.gf}</td>
                  <td className="px-2 py-2 text-center">{team.ga}</td>
                  <td className={`px-2 py-2 text-center ${team.gd > 0 ? 'text-green-400' : team.gd < 0 ? 'text-red-400' : ''}`}>
                    {team.gd > 0 ? `+${team.gd}` : team.gd}
                  </td>
                  <td className="px-2 py-2 text-center font-bold text-white">{team.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
