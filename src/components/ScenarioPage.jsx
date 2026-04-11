import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { BASE_URL } from '../config.js';
import ShareButtons from './ShareButtons.jsx';
import { TeamFlag, YellowCard, DoubleYellowCard, RedCard } from './scenario/shared.jsx';
import { makeStandingsMd, makeStandingsHtml } from './scenario/shareHelpers.js';
import GroupStandingsTable from './scenario/GroupStandingsTable.jsx';
import { MatchList } from './scenario/MatchRow.jsx';
import TeamScenarioPanel from './scenario/TeamScenarioPanel.jsx';
import { useTeamName } from '../i18n/useTeamName.js';

export default function ScenarioPage({ selectedGroupKey, onSelectGroup, selectedTeamId, onSelectTeam, fromNavigation, groups, onScoreChange, allGroupStandings, thirdAnalysis, predictor }) {
  const { t } = useTranslation('scenario');
  const { t: tShare } = useTranslation('share');
  const teamName = useTeamName();
  const shareCtx = { t: tShare, teamName };
  const [selectorOpen, setSelectorOpen] = useState(true);
  const [matchOpen, setMatchOpen] = useState(false);
  const groupEntries = Object.entries(groups);

  React.useEffect(() => {
    if (selectedGroupKey) {
      if (fromNavigation) setSelectorOpen(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroupKey]);

  const selectedGroup = selectedGroupKey ? groups[selectedGroupKey] : null;
  const selectedTeam = selectedGroup?.standings.find((t) => t.id === selectedTeamId) ?? null;

  return (
    <div className="space-y-4">

      {/* ── 조·팀 선택 (접기 가능) ─────────────────────── */}
      <div className="card overflow-hidden">
        <button
          onClick={() => setSelectorOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-colors"
        >
          <span className="text-xs font-medium text-fifa-muted">
            {t('selector.title')}
            {selectedGroupKey && (
              <span className="ml-2 text-white font-bold">
                {selectedTeam
                  ? t('selector.selectedTeam', { group: selectedGroupKey, team: teamName(selectedTeam) })
                  : t('selector.selected', { group: selectedGroupKey })}
              </span>
            )}
          </span>
          {selectorOpen
            ? <ChevronUp size={14} className="text-fifa-muted" />
            : <ChevronDown size={14} className="text-fifa-muted" />}
        </button>

        {selectorOpen && (
          <div className="px-3 pb-3 pt-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-2">
              {groupEntries.map(([key, { standings }]) => {
                const isGroupSelected = selectedGroupKey === key;
                return (
                  <div
                    key={key}
                    className={`flex flex-col rounded-lg border overflow-hidden transition-all
                      ${isGroupSelected
                        ? 'border-sky-400/50'
                        : 'border-fifa-border/40'}`}
                  >
                    <button
                      onClick={() => { onSelectGroup(key); setSelectorOpen(false); }}
                      className={`flex items-center justify-between px-3 py-1.5 text-left transition-colors
                        ${isGroupSelected
                          ? 'bg-sky-400/20 hover:bg-sky-400/25'
                          : 'bg-white/5 hover:bg-white/10'}`}
                    >
                      <span className="text-xs font-bold text-white">{t('selector.groupLabel', { group: key })}</span>
                      <ChevronRight size={11} className={isGroupSelected ? 'text-sky-400' : 'text-fifa-muted/40'} />
                    </button>

                    <div className="flex flex-col">
                      {standings.map((tm) => {
                        const isTeamSelected = isGroupSelected && selectedTeamId === tm.id;
                        const tn = teamName(tm);
                        return (
                          <button
                            key={tm.id}
                            onClick={() => {
                              if (!isGroupSelected) onSelectGroup(key);
                              onSelectTeam(tm.id);
                              setSelectorOpen(false);
                            }}
                            className={`flex items-center gap-2 px-3 py-2 text-left transition-colors border-t border-fifa-border/20
                              ${isTeamSelected
                                ? 'bg-sky-400/15 text-sky-300'
                                : 'hover:bg-white/8 text-fifa-muted hover:text-white'}`}
                          >
                            {tm.flagImg
                              ? <img src={`${BASE_URL}${tm.flagImg}`} alt={tn} className="w-7 h-5 object-cover rounded-sm shrink-0" />
                              : <span className="text-base leading-none shrink-0">{tm.flag}</span>}
                            <span className={`text-xs truncate ${isTeamSelected ? 'font-medium' : ''}`}>{tn}</span>
                            {isTeamSelected && <ChevronRight size={9} className="text-sky-400 ml-auto shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── 선택된 조 상세 ─────────────────────────────── */}
      {selectedGroupKey && selectedGroup ? (
        <div className="space-y-4">
          {/* 섹션 헤더 */}
          <div className="flex items-center gap-2 pb-1 border-b border-fifa-border/30">
            <span className="text-lg font-bold text-white">{t('selector.groupLabel', { group: selectedGroupKey })}</span>
            <div className="flex gap-1">
              {selectedGroup.standings.map((tm) => {
                const tn = teamName(tm);
                return (
                  <span key={tm.id} title={tn}>
                    {tm.flagImg
                      ? <img src={`${BASE_URL}${tm.flagImg}`} alt={tn} className="w-6 h-4 object-cover rounded-sm" />
                      : <span>{tm.flag}</span>}
                  </span>
                );
              })}
            </div>
            {selectedTeam && (
              <>
                <ChevronRight size={14} className="text-fifa-muted" />
                <div className="flex items-center gap-1.5">
                  <TeamFlag team={selectedTeam} />
                  <span className="text-sm font-bold text-sky-400">{teamName(selectedTeam)}</span>
                </div>
              </>
            )}
          </div>

          {/* 순위표 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-fifa-muted font-medium">{t('section.standings')}</p>
              <ShareButtons
                targetId="scenario-standings-box"
                generateMarkdown={() => makeStandingsMd(selectedGroupKey, selectedGroup.standings, shareCtx)}
                generateHtmlTable={() => makeStandingsHtml(selectedGroupKey, selectedGroup.standings, shareCtx)}
              />
            </div>
            <div id="scenario-standings-box" className="bg-fifa-dark rounded-lg">
            <GroupStandingsTable
              standings={selectedGroup.standings}
              highlightId={selectedTeamId}
              onTeamClick={(teamId) => onSelectTeam(teamId)}
            />
            <div className="flex items-center justify-between mt-2 px-1 text-xs text-fifa-muted flex-wrap gap-y-1">
              <div className="flex gap-4">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />{t('legend.qualified')}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />{t('legend.thirdContender')}</span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[10px] text-fifa-muted/60">
                <YellowCard /> <span>-1</span>
                <DoubleYellowCard /> <span>-3</span>
                <RedCard /> <span>-4</span>
                <span>{t('legend.fairPlay')}</span>
              </span>
            </div>
            </div>
          </div>

          {/* 팀별 경우의 수 (팀 선택 시) */}
          {selectedTeam && (
            <TeamScenarioPanel
              team={selectedTeam}
              standings={selectedGroup.standings}
              matches={selectedGroup.matches ?? []}
              teams={selectedGroup.teams ?? []}
              groupKey={selectedGroupKey}
              groups={groups}
              allGroupStandings={allGroupStandings}
              thirdAnalysis={thirdAnalysis}
              predictor={predictor}
            />
          )}

          {/* 경기 일정 / 결과 (접기 가능) */}
          <div className="card overflow-hidden">
            <button
              onClick={() => setMatchOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-colors"
            >
              <span className="text-xs font-medium text-fifa-muted">
                {matchOpen ? t('section.matchScheduleOpen') : t('section.matchScheduleClosed')}
              </span>
              {matchOpen
                ? <ChevronUp size={14} className="text-fifa-muted" />
                : <ChevronDown size={14} className="text-fifa-muted" />}
            </button>
            {matchOpen && (
              <MatchList
                matches={selectedGroup.matches}
                standings={selectedGroup.standings}
                groupKey={selectedGroupKey}
                onScoreChange={onScoreChange}
                highlightId={selectedTeamId}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-fifa-muted gap-3">
          <span className="text-4xl opacity-20">⚽</span>
          <p className="text-sm">{t('emptyState')}</p>
        </div>
      )}
    </div>
  );
}
