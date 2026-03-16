import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const STATUS_COLORS = {
  qualified: 'text-green-400',
  eliminated: 'text-red-400',
  pending: 'text-fifa-muted',
};

const RANK_BG = {
  1: 'bg-green-900/40 border-l-2 border-green-500',
  2: 'bg-green-900/20 border-l-2 border-green-700',
  3: 'bg-yellow-900/20 border-l-2 border-yellow-600',
  4: 'bg-transparent',
};

export default function GroupTable({ groupKey, standings, matches, onScoreChange }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-fifa-blue/20 border-b border-fifa-border cursor-pointer"
        onClick={() => setCollapsed((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg text-white">조 {groupKey}</span>
          <div className="flex gap-1">
            {standings.map((t) => (
              <span key={t.id} className="text-sm" title={t.name}>{t.flag}</span>
            ))}
          </div>
        </div>
        {collapsed ? <ChevronDown size={16} className="text-fifa-muted" /> : <ChevronUp size={16} className="text-fifa-muted" />}
      </div>

      {!collapsed && (
        <>
          {/* Standings Table */}
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
                    className={`border-b border-fifa-border/30 hover:bg-white/5 transition-colors ${RANK_BG[idx + 1] || ''}`}
                  >
                    <td className="px-3 py-2 text-fifa-muted text-xs">{idx + 1}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{team.flag}</span>
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

          {/* Matches */}
          {matches && (
            <div className="px-4 py-3 border-t border-fifa-border/30">
              <p className="text-xs text-fifa-muted mb-2">경기 결과 입력</p>
              <div className="space-y-2">
                {matches.map((match) => {
                  const homeTeam = standings.find((t) => t.id === match.home);
                  const awayTeam = standings.find((t) => t.id === match.away);
                  if (!homeTeam || !awayTeam) return null;
                  return (
                    <div key={match.id} className="flex items-center gap-2 text-sm">
                      <div className="flex items-center gap-1 flex-1 justify-end">
                        <span className="text-xs hidden sm:inline">{homeTeam.name}</span>
                        <span>{homeTeam.flag}</span>
                      </div>
                      <div className="flex items-center gap-1">
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
                      </div>
                      <div className="flex items-center gap-1 flex-1 justify-start">
                        <span>{awayTeam.flag}</span>
                        <span className="text-xs hidden sm:inline">{awayTeam.name}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
