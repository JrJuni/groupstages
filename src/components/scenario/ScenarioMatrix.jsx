import React from 'react';
import { BASE_URL } from '../../config.js';
import { RANK_COLORS, WDL_KO } from './shared.jsx';
import RankCell from './RankCell.jsx';
import QualConditionSummary from './QualConditionSummary.jsx';

export default function ScenarioMatrix({ data, standings }) {
  const {
    teamMatch, otherMatch, teamIsHome, matrix,
    rankProbabilities, topTwoProbability, thirdPlaceAdvancingProbability,
  } = data;

  const homeTeam = standings.find(t => t.id === teamMatch.home);
  const awayTeam = standings.find(t => t.id === teamMatch.away);
  const otherHomeTeam = otherMatch ? standings.find(t => t.id === otherMatch.home) : null;
  const otherAwayTeam = otherMatch ? standings.find(t => t.id === otherMatch.away) : null;
  const analyzedTeam = standings.find(t => t.id === data.teamId);

  const teamRows = ['W', 'D', 'L'];
  const hasOther = otherMatch !== null;

  return (
    <div className="space-y-3">
      {/* 경기 레이블 */}
      <div className="space-y-0.5">
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="text-sky-400 font-medium shrink-0">내 경기</span>
          <span className="text-white">{homeTeam?.name}</span>
          <span className="text-fifa-muted">vs</span>
          <span className="text-white">{awayTeam?.name}</span>
          <span className="text-[10px] text-fifa-muted ml-1">({teamIsHome ? '홈' : '원정'})</span>
        </div>
        {hasOther && otherHomeTeam && (
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-fifa-muted font-medium shrink-0">다른 경기</span>
            <span className="text-white">{otherHomeTeam.name}</span>
            <span className="text-fifa-muted">vs</span>
            <span className="text-white">{otherAwayTeam?.name}</span>
          </div>
        )}
      </div>

      {/* 3×3 매트릭스 (또는 3×1) */}
      <div className="overflow-x-auto">
        {hasOther ? (
          <div className="min-w-[260px]">
            {/* 컬럼 헤더 */}
            <div className="grid grid-cols-4 gap-0.5 mb-0.5">
              <div className="flex items-end justify-end pr-1 pb-1">
                <span className="text-[9px] text-fifa-muted/60">내↓ 타→</span>
              </div>
              {['W', 'D', 'L'].map(c => {
                const t = c === 'W' ? otherHomeTeam : c === 'L' ? otherAwayTeam : null;
                return (
                  <div key={c} className="flex flex-col items-center justify-center gap-0.5 py-1.5 bg-white/5 rounded-sm">
                    {t ? (
                      <>
                        {t.flagImg
                          ? <img src={`${BASE_URL}${t.flagImg}`} alt={t.name} className="w-5 h-3.5 object-cover rounded-sm" />
                          : <span className="text-xs leading-none">{t.flag}</span>}
                        <span className="text-[9px] text-fifa-muted font-medium leading-none">{t.name} 승</span>
                      </>
                    ) : (
                      <span className="text-[10px] text-fifa-muted font-medium">무</span>
                    )}
                  </div>
                );
              })}
            </div>
            {/* 데이터 행 */}
            {teamRows.map(rowWDL => (
              <div key={rowWDL} className="grid grid-cols-4 gap-0.5 mb-0.5">
                <div className="flex items-center justify-center bg-white/5 rounded-sm text-[10px] font-bold text-fifa-muted min-h-[44px]">
                  {WDL_KO[rowWDL]}
                </div>
                {['W', 'D', 'L'].map(colWDL => {
                  const cell = matrix.find(m => m.teamWDL === rowWDL && m.otherWDL === colWDL);
                  return (
                    <div key={colWDL} className="border border-fifa-border/20 rounded-sm overflow-hidden">
                      {cell && <RankCell breakdown={cell.breakdown} definitive={cell.definitive} />}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-0.5">
            {teamRows.map(rowWDL => {
              const cell = matrix.find(m => m.teamWDL === rowWDL && m.otherWDL === 'W');
              return (
                <div key={rowWDL} className="flex items-stretch gap-0.5">
                  <div className="w-8 flex items-center justify-center bg-white/5 rounded-sm text-[10px] font-bold text-fifa-muted shrink-0">
                    {WDL_KO[rowWDL]}
                  </div>
                  <div className="flex-1 border border-fifa-border/20 rounded-sm overflow-hidden">
                    {cell && <RankCell breakdown={cell.breakdown} definitive={cell.definitive} />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 전체 순위 확률 분포 */}
      <div className="space-y-1.5 pt-3 border-t border-fifa-border/30">
        {[1, 2, 3, 4].map(rank => {
          const pct = rankProbabilities[rank] || 0;
          if (pct === 0) return null;
          const c = RANK_COLORS[rank];
          return (
            <div key={rank} className="flex items-center gap-2">
              <span className={`text-[11px] font-bold w-6 ${c.text}`}>{rank}위</span>
              <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
                <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${pct}%` }} />
              </div>
              <span className={`text-[11px] font-medium w-8 text-right ${c.text}`}>{pct}%</span>
            </div>
          );
        })}
      </div>

      {/* 진출 확률 요약 */}
      <div className="pt-2 border-t border-fifa-border/20 flex items-center gap-4 flex-wrap">
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-fifa-muted mb-0.5">1·2위</span>
          <span className="text-lg font-bold text-emerald-300">{topTwoProbability}%</span>
        </div>
        {thirdPlaceAdvancingProbability > 0 && (
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-fifa-muted mb-0.5">3위</span>
            <span className="text-lg font-bold text-yellow-300">{thirdPlaceAdvancingProbability}%</span>
          </div>
        )}
      </div>

      <QualConditionSummary
        matrix={matrix}
        hasOther={hasOther}
        otherHomeTeam={otherHomeTeam}
        otherAwayTeam={otherAwayTeam}
        teamName={analyzedTeam?.name ?? ''}
        currentStandings={data.currentStandings}
        teamId={data.teamId}
      />
    </div>
  );
}
