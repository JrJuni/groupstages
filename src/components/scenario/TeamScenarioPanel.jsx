import React from 'react';
import { Users } from 'lucide-react';
import { runBruteForce } from '../../utils/scenarioComputer.js';
import { TeamFlag } from './shared.jsx';
import { makeScenarioPanelMd, makeScenarioPanelHtml } from './shareHelpers.js';
import ScenarioMatrix from './ScenarioMatrix.jsx';
import ShareButtons from '../ShareButtons.jsx';

function computeTeamScenarios(team, standings, matches) {
  const remaining = matches.filter(
    (m) => !m.played && (m.home === team.id || m.away === team.id)
  );
  const totalPlayed = matches.filter((m) => m.played).length;
  const maxPts = team.pts + remaining.length * 3;
  const rank = standings.findIndex((t) => t.id === team.id) + 1;
  const allGroupPlayed = matches.every((m) => m.played);

  const canBeOvertakenBy = standings.filter((t) => {
    if (t.id === team.id) return false;
    const otherRemaining = matches.filter(
      (m) => !m.played && (m.home === t.id || m.away === t.id)
    ).length;
    return t.pts + otherRemaining * 3 > team.pts;
  });
  const isGuaranteedTop2 = canBeOvertakenBy.length <= 1;

  const alreadyAhead = standings.filter(
    (t) => t.id !== team.id && t.pts > maxPts
  );
  const isEliminated = alreadyAhead.length >= 2;

  return { remaining, maxPts, rank, totalPlayed, allGroupPlayed, isGuaranteedTop2, isEliminated };
}

export default function TeamScenarioPanel({ team, standings, matches, teams }) {
  const { remaining, maxPts, rank, totalPlayed, allGroupPlayed, isGuaranteedTop2, isEliminated } = computeTeamScenarios(team, standings, matches);

  const scenarioActive = totalPlayed >= 2;

  const bruteForce = React.useMemo(() => {
    if (!scenarioActive || remaining.length === 0) return null;
    return runBruteForce(team.id, teams, matches);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioActive, team.id, JSON.stringify(matches)]);

  const rankLabel = rank === 1 ? '1위' : rank === 2 ? '2위' : rank === 3 ? '3위' : '4위';
  const rankColor = rank <= 2 ? 'text-green-400' : rank === 3 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div id={`scenario-panel-${team.id}`} className="card overflow-hidden">
      {/* 팀 헤더 */}
      <div className="px-4 py-3 bg-sky-400/10 border-b border-fifa-border flex items-center gap-3">
        <TeamFlag team={team} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white text-base">{team.name}</span>
            <span className={`text-xs font-bold ${rankColor}`}>현재 {rankLabel}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-fifa-muted">
            <span>{team.played}경기</span>
            <span className="text-white font-bold">{team.pts}점</span>
            <span>득실 {team.gd > 0 ? `+${team.gd}` : team.gd}</span>
            <span>득점 {team.gf}</span>
          </div>
        </div>
        <ShareButtons
          targetId={`scenario-panel-${team.id}`}
          generateMarkdown={() => makeScenarioPanelMd(team, rank, bruteForce, standings)}
          generateHtmlTable={() => makeScenarioPanelHtml(team, rank, bruteForce)}
        />
      </div>

      {/* 잔여 경기 */}
      <div className="px-4 py-3 border-b border-fifa-border/30">
        <p className="text-xs font-medium text-fifa-muted mb-2">
          잔여 경기 <span className="text-white">{remaining.length}경기</span>
          {remaining.length > 0 && (
            <span className="ml-2 text-sky-400">최대 {maxPts}점 획득 가능</span>
          )}
        </p>
        {remaining.length === 0 ? (
          <p className="text-xs text-fifa-muted">모든 경기 완료</p>
        ) : (
          <div className="space-y-1.5">
            {remaining.map((m) => {
              const opp = standings.find((t) => t.id === (m.home === team.id ? m.away : m.home));
              const isHome = m.home === team.id;
              return (
                <div key={m.id} className="flex items-center gap-2 text-xs bg-white/5 rounded px-3 py-1.5">
                  <span className="text-fifa-muted text-[10px] w-16 shrink-0">
                    {m.matchday ? `경기일 ${m.matchday}` : '—'}
                  </span>
                  <span className={isHome ? 'text-white' : 'text-fifa-muted'}>
                    {isHome ? `${team.name} vs` : `vs ${team.name}`}
                  </span>
                  {opp && (
                    <span className="flex items-center gap-1">
                      <TeamFlag team={opp} />
                      <span className="text-white">{opp.name}</span>
                      <span className="text-fifa-muted ml-1">({opp.pts}점)</span>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 16강 진출 경우의 수 */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <p className="text-xs font-medium text-fifa-muted flex items-center gap-1">
            <Users size={11} />
            16강 진출 경우의 수
          </p>
          {scenarioActive ? (() => {
            const isConfirmedTop2 = bruteForce
              ? bruteForce.topTwoProbability === 100
              : isGuaranteedTop2;
            const teamRemaining = remaining.find(m => m.home === team.id || m.away === team.id);
            const isMatchLive = teamRemaining &&
              teamRemaining.homeScore !== null && teamRemaining.homeScore !== '';
            const isLikelyAdvancing = !isConfirmedTop2 && !isEliminated && team.pts >= 4 && !!bruteForce && !isMatchLive;
            return (
              <>
                {isConfirmedTop2 && !isEliminated && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-green-900/50 text-green-300 border border-green-700/50">
                    진출 확정
                  </span>
                )}
                {isEliminated && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-red-900/50 text-red-300 border border-red-700/50">
                    탈락 확정
                  </span>
                )}
                {isLikelyAdvancing && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-sky-900/50 text-sky-300 border border-sky-700/50">
                    진출 유력
                  </span>
                )}
                {!isConfirmedTop2 && !isEliminated && !isLikelyAdvancing && (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-yellow-900/40 text-yellow-300 border border-yellow-700/40">
                    진출 미확정
                  </span>
                )}
              </>
            );
          })() : (
            <span className="text-[10px] text-fifa-muted/60 bg-white/5 px-1.5 py-0.5 rounded">
              조별 2경기 이후 활성화
            </span>
          )}
        </div>

        {scenarioActive ? (
          bruteForce ? (
            <ScenarioMatrix data={bruteForce} standings={standings} />
          ) : (
            <p className="text-xs text-fifa-muted text-center py-4">모든 경기 완료</p>
          )
        ) : (
          <div className="rounded-lg bg-white/3 border border-fifa-border/20 px-4 py-4 text-center">
            <p className="text-xs text-fifa-muted/50">
              조에서 {2 - totalPlayed}경기 더 진행되면 분석이 시작됩니다
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
