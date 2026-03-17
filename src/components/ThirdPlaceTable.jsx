import React from 'react';
import { Trophy, TrendingUp, Database, WifiOff } from 'lucide-react';
import { BASE_URL } from '../config.js';
import { FIFA_RANKINGS_CURRENT } from '../data/worldcup2026.js';

export default function ThirdPlaceTable({ best8, allThirds, loading = false, apiAvailable = true }) {
  const qualifiedIds = new Set(best8.map((t) => t.id));

  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 bg-yellow-900/20 border-b border-fifa-border flex items-center gap-2 flex-wrap">
        <Trophy size={16} className="text-fifa-gold" />
        <span className="font-bold text-white">조 3위 상위 8팀 (16강 진출)</span>
        <div className="flex items-center gap-2 ml-auto">
          <span
            title={apiAvailable ? 'DB에서 실시간 쿼리' : '로컬 계산'}
            className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
              apiAvailable
                ? 'bg-green-900/30 text-green-400'
                : 'bg-gray-700/50 text-gray-400'
            }`}
          >
            {apiAvailable ? <Database size={9} /> : <WifiOff size={9} />}
            {apiAvailable ? 'DB' : 'Local'}
          </span>
          <span className="text-xs text-fifa-muted">{best8.length}/8팀 확정</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-fifa-muted text-xs border-b border-fifa-border">
              <th className="px-3 py-2 text-left">#</th>
              <th className="px-3 py-2 text-left">팀</th>
              <th className="px-2 py-2 text-center">조</th>
              <th className="px-2 py-2 text-center">경</th>
              <th className="px-2 py-2 text-center">승</th>
              <th className="px-2 py-2 text-center">무</th>
              <th className="px-2 py-2 text-center">패</th>
              <th className="px-2 py-2 text-center">득실</th>
              <th className="px-2 py-2 text-center font-bold">승점</th>
              <th className="px-2 py-2 text-center" title="FIFA 랭킹">FIFA</th>
              <th className="px-2 py-2 text-center">상태</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={11} className="text-center py-8 text-fifa-muted animate-pulse">
                  DB에서 데이터 로딩 중...
                </td>
              </tr>
            ) : allThirds.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-8 text-fifa-muted animate-pulse">
                  데이터 로딩 중...
                </td>
              </tr>
            ) : (
              allThirds.map((team, idx) => {
                const isQualified = qualifiedIds.has(team.id);
                return (
                  <tr
                    key={`${team.group}_${team.id}`}
                    className={`border-b border-fifa-border/30 transition-colors ${
                      isQualified
                        ? 'bg-green-900/20 hover:bg-green-900/30'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <td className="px-3 py-2 text-fifa-muted">{idx + 1}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {team.flagImg
                          ? <img src={`${BASE_URL}${team.flagImg}`} alt={team.name} className="w-6 h-4 object-cover rounded-sm" />
                          : <span>{team.flag}</span>}
                        <span className="font-medium text-white">{team.name}</span>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <span className="bg-fifa-blue/30 text-white text-xs px-2 py-0.5 rounded font-bold">
                        {team.group}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-center text-fifa-muted">{team.played}</td>
                    <td className="px-2 py-2 text-center text-green-400">{team.won}</td>
                    <td className="px-2 py-2 text-center">{team.drawn}</td>
                    <td className="px-2 py-2 text-center text-red-400">{team.lost}</td>
                    <td className={`px-2 py-2 text-center ${team.gd > 0 ? 'text-green-400' : team.gd < 0 ? 'text-red-400' : ''}`}>
                      {team.gd > 0 ? `+${team.gd}` : team.gd}
                    </td>
                    <td className="px-2 py-2 text-center font-bold text-white">{team.pts}</td>
                    <td className="px-2 py-2 text-center text-fifa-muted text-xs">
                      {(FIFA_RANKINGS_CURRENT[team.id] ?? '—')}
                    </td>
                    <td className="px-2 py-2 text-center">
                      {isQualified ? (
                        <span className="text-xs bg-green-900/40 text-green-400 px-2 py-0.5 rounded-full">
                          {team.played === 0 ? '↑ 시드' : '✓ 진출'}
                        </span>
                      ) : (
                        <span className="text-xs text-fifa-muted">
                          {team.played === 0 ? '↓ 시드' : '탈락'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="px-4 py-3 border-t border-fifa-border/30 flex flex-wrap gap-4 text-xs text-fifa-muted">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-900/40 border border-green-500 rounded" />
          <span>16강 진출 (상위 8팀)</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp size={12} />
          <span>승점 → 득실차 → 다득점 → 페어플레이 → FIFA 랭킹 순으로 결정</span>
        </div>
      </div>
    </div>
  );
}
