import React from 'react';
import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';
import { runBruteForce } from '../../utils/scenarioComputer.js';
import { TeamFlag } from './shared.jsx';
import { makeScenarioPanelMd, makeScenarioPanelHtml } from './shareHelpers.js';
import ScenarioMatrix from './ScenarioMatrix.jsx';
import R32MatchupPreview from './R32MatchupPreview.jsx';
import ShareButtons from '../ShareButtons.jsx';
import { useTeamName } from '../../i18n/useTeamName.js';

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

export default function TeamScenarioPanel({ team, standings, matches, teams, groupKey, groups, allGroupStandings, thirdAnalysis }) {
  const { t } = useTranslation('scenario');
  const { t: tShare } = useTranslation('share');
  const teamName = useTeamName();
  const shareCtx = { t: tShare, teamName };
  const { remaining, maxPts, rank, totalPlayed, allGroupPlayed, isGuaranteedTop2, isEliminated } = computeTeamScenarios(team, standings, matches);

  const scenarioActive = totalPlayed >= 2;

  const bruteForce = React.useMemo(() => {
    if (!scenarioActive || remaining.length === 0) return null;
    return runBruteForce(team.id, teams, matches);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioActive, team.id, JSON.stringify(matches)]);

  const rankLabel = t(`panel.rankLabels.${Math.min(rank, 4)}`);
  const rankColor = rank <= 2 ? 'text-green-400' : rank === 3 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div id={`scenario-panel-${team.id}`} className="card overflow-hidden">
      {/* 팀 헤더 */}
      <div className="px-4 py-3 bg-sky-400/10 border-b border-fifa-border flex items-center gap-3">
        <TeamFlag team={team} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white text-base">{teamName(team)}</span>
            <span className={`text-xs font-bold ${rankColor}`}>{t('panel.currentRank', { rank: rankLabel })}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-fifa-muted">
            <span>{t('panel.matchesCount', { count: team.played })}</span>
            <span className="text-white font-bold">{t('panel.pointsCount', { count: team.pts })}</span>
            <span>{t('panel.goalDiff', { value: team.gd > 0 ? `+${team.gd}` : team.gd })}</span>
            <span>{t('panel.goalsForCount', { count: team.gf })}</span>
          </div>
        </div>
        <ShareButtons
          targetId={`scenario-panel-${team.id}`}
          generateMarkdown={() => makeScenarioPanelMd(team, rank, bruteForce, standings, shareCtx)}
          generateHtmlTable={() => makeScenarioPanelHtml(team, rank, bruteForce, shareCtx)}
        />
      </div>

      {/* 잔여 경기 */}
      <div className="px-4 py-3 border-b border-fifa-border/30">
        <p className="text-xs font-medium text-fifa-muted mb-2">
          {t('panel.remainingTitle')} <span className="text-white">{t('panel.remainingCount', { count: remaining.length })}</span>
          {remaining.length > 0 && (
            <span className="ml-2 text-sky-400">{t('panel.maxPoints', { count: maxPts })}</span>
          )}
        </p>
        {remaining.length === 0 ? (
          <p className="text-xs text-fifa-muted">{t('panel.allDone')}</p>
        ) : (
          <div className="space-y-1.5">
            {remaining.map((m) => {
              const opp = standings.find((tm) => tm.id === (m.home === team.id ? m.away : m.home));
              const isHome = m.home === team.id;
              return (
                <div key={m.id} className="flex items-center gap-2 text-xs bg-white/5 rounded px-3 py-1.5">
                  <span className="text-fifa-muted text-[10px] w-16 shrink-0">
                    {m.matchday ? t('panel.matchdayLabel', { md: m.matchday }) : '—'}
                  </span>
                  <span className={isHome ? 'text-white' : 'text-fifa-muted'}>
                    {isHome ? `${teamName(team)} vs` : `vs ${teamName(team)}`}
                  </span>
                  {opp && (
                    <span className="flex items-center gap-1">
                      <TeamFlag team={opp} />
                      <span className="text-white">{teamName(opp)}</span>
                      <span className="text-fifa-muted ml-1">{t('panel.oppPoints', { count: opp.pts })}</span>
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
            {t('panel.title16')}
          </p>
          {scenarioActive ? (() => {
            const isConfirmedTop2 = bruteForce
              ? bruteForce.topTwoProbability === 100
              : isGuaranteedTop2;
            // 3위 진출 가능성까지 고려한 진짜 탈락 확정
            const thirdEliminated = thirdAnalysis?.eliminatedGroups?.has(groupKey) ?? false;
            const isFullyEliminated = isEliminated && thirdEliminated;
            // 1·2위는 불가하지만 3위로 진출 가능성이 살아있는 상태
            const isThirdContender = isEliminated && !thirdEliminated;
            return (
              <>
                {isConfirmedTop2 && !isFullyEliminated && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-green-900/50 text-green-300 border border-green-700/50">
                    {t('badge.qualified')}
                  </span>
                )}
                {isFullyEliminated && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-red-900/50 text-red-300 border border-red-700/50">
                    {t('badge.eliminated')}
                  </span>
                )}
                {isThirdContender && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-yellow-900/50 text-yellow-300 border border-yellow-700/50">
                    {t('badge.thirdContender')}
                  </span>
                )}
                {!isConfirmedTop2 && !isFullyEliminated && !isThirdContender && (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-yellow-900/40 text-yellow-300 border border-yellow-700/40">
                    {t('badge.uncertain')}
                  </span>
                )}
              </>
            );
          })() : (
            <span className="text-[10px] text-fifa-muted/60 bg-white/5 px-1.5 py-0.5 rounded">
              {t('panel.activateNotice')}
            </span>
          )}
        </div>

        {scenarioActive ? (
          bruteForce ? (
            <>
              <ScenarioMatrix data={bruteForce} standings={standings} />
              {groupKey && groups && allGroupStandings && thirdAnalysis && (
                <R32MatchupPreview
                  team={team}
                  groupKey={groupKey}
                  groups={groups}
                  allGroupStandings={allGroupStandings}
                  thirdAnalysis={thirdAnalysis}
                />
              )}
            </>
          ) : (
            <>
              <p className="text-xs text-fifa-muted text-center py-4">{t('panel.allDone')}</p>
              {groupKey && groups && allGroupStandings && thirdAnalysis && (
                <R32MatchupPreview
                  team={team}
                  groupKey={groupKey}
                  groups={groups}
                  allGroupStandings={allGroupStandings}
                  thirdAnalysis={thirdAnalysis}
                />
              )}
            </>
          )
        ) : (
          <div className="rounded-lg bg-white/3 border border-fifa-border/20 px-4 py-4 text-center">
            <p className="text-xs text-fifa-muted/50">
              {t('panel.needMore', { count: 2 - totalPlayed })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
