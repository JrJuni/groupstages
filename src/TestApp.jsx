import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Shuffle, Trophy, Menu, X, RotateCcw, GitBranch, BookOpen, FlaskConical, ExternalLink, Swords } from 'lucide-react';
import { getBest8ThirdPlace, getFairPlayPoints } from './utils/rankings.js';
import { analyzeThirdPlaceCombinations, computeThirdRange } from './utils/knockout.js';
import { leagueConfig } from './leagues/worldcup2026/index.js';
import { useTestMatches } from './hooks/useTestMatches.js';
import GroupTable from './components/GroupTable.jsx';
import ThirdPlaceTable from './components/ThirdPlaceTable.jsx';
import ScenarioPage from './components/ScenarioPage.jsx';
import RulesPage from './components/RulesPage.jsx';
import DrawSimulator from './components/DrawSimulator.jsx';
import BracketPage from './components/knockout/BracketPage.jsx';
import { Link, useParams } from 'react-router-dom';
import LanguageSwitcher from './i18n/LanguageSwitcher.jsx';
import { useDocumentMeta } from './i18n/useDocumentMeta.js';

const TAB_DEFS = [
  { id: 'groups', icon: Globe },
  { id: 'scenarios', icon: GitBranch },
  { id: 'thirds', icon: Trophy },
  { id: 'knockout', icon: Swords },
  { id: 'draw', icon: Shuffle },
  { id: 'rules', icon: BookOpen },
];

export default function TestApp() {
  const { t } = useTranslation('common');
  useDocumentMeta();
  const { lang } = useParams();
  const TABS = useMemo(
    () => TAB_DEFS.map((tab) => ({ ...tab, label: t(`tabs.${tab.id}`) })),
    [t]
  );
  const { groups, loading, apiAvailable, handleScoreChange, handleCardChange, resetAll } = useTestMatches();
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('gs_activeTab') || 'groups');
  const [menuOpen, setMenuOpen] = useState(false);
  const [scenarioGroupKey, setScenarioGroupKey] = useState(() => localStorage.getItem('gs_scenarioGroup') || null);
  const [scenarioTeamId, setScenarioTeamId] = useState(() => localStorage.getItem('gs_scenarioTeam') || null);
  const [scenarioFromNav, setScenarioFromNav] = useState(false);

  const handleTabClick = (id) => {
    localStorage.setItem('gs_activeTab', id);
    if (id === 'scenarios') {
      localStorage.removeItem('gs_scenarioGroup');
      localStorage.removeItem('gs_scenarioTeam');
      setScenarioGroupKey(null);
      setScenarioTeamId(null);
      setScenarioFromNav(false);
    }
    setActiveTab(id);
  };

  const navigateToScenario = (groupKey, teamId = null) => {
    localStorage.setItem('gs_scenarioGroup', groupKey);
    if (teamId) localStorage.setItem('gs_scenarioTeam', teamId);
    else localStorage.removeItem('gs_scenarioTeam');
    setScenarioGroupKey(groupKey);
    setScenarioTeamId(teamId);
    setScenarioFromNav(true);
    localStorage.setItem('gs_activeTab', 'scenarios');
    setActiveTab('scenarios');
  };

  const allGroupStandings = useMemo(
    () => Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, v.standings])),
    [groups]
  );

  const best8 = useMemo(
    () => getBest8ThirdPlace(allGroupStandings),
    [allGroupStandings]
  );

  const thirdAnalysis = useMemo(
    () => analyzeThirdPlaceCombinations(groups),
    [groups]
  );

  const allThirds = useMemo(() => {
    return Object.entries(allGroupStandings)
      .map(([group, standings]) => {
        if (!standings || standings.length < 3) return null;
        const t = standings[2];
        const { teams, matches } = groups[group];
        const range = computeThirdRange(teams, matches);
        const nextMatch = (matches ?? []).find(m => !m.played && (m.home === t.id || m.away === t.id));
        const nextOppId = nextMatch ? (nextMatch.home === t.id ? nextMatch.away : nextMatch.home) : null;
        const nextOpponent = nextOppId ? (standings.find(s => s.id === nextOppId) ?? null) : null;
        return {
          group, ...t,
          fifaRank: leagueConfig.rankingsCurrent[t.id] ?? null,
          ptsMin: range.min, ptsMax: range.max,
          nextOpponent,
          qualified: thirdAnalysis.qualifiedGroups.has(group),
          eliminated: thirdAnalysis.eliminatedGroups.has(group),
        };
      })
      .filter((t) => t !== null)
      .sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.gd !== a.gd) return b.gd - a.gd;
        if (b.gf !== a.gf) return b.gf - a.gf;
        const fpA = getFairPlayPoints(a), fpB = getFairPlayPoints(b);
        if (fpB !== fpA) return fpB - fpA;
        const ra = leagueConfig.rankings[a.id] ?? 999, rb = leagueConfig.rankings[b.id] ?? 999;
        if (ra !== rb) return ra - rb;
        return (leagueConfig.seeds[a.id] ?? 99) - (leagueConfig.seeds[b.id] ?? 99);
      });
  }, [allGroupStandings, groups, thirdAnalysis]);

  const handleReset = () => {
    if (!window.confirm(t('dialog.confirmResetTest'))) return;
    resetAll();
  };

  return (
    <div className="min-h-screen bg-fifa-dark">
      {/* ── TEST MODE 배너 ── */}
      <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-amber-400 text-xs font-medium">
          <FlaskConical size={13} />
          {t('test.modeBanner')}
        </div>
        <Link
          to={`/${lang || 'en'}`}
          className="flex items-center gap-1 text-xs text-amber-400/70 hover:text-amber-300 transition-colors"
        >
          <ExternalLink size={11} />
          {t('test.backToMain')}
        </Link>
      </div>

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-fifa-dark/95 backdrop-blur border-b border-amber-500/20">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧪</span>
            <div>
              <h1 className="text-base font-bold text-white leading-tight flex items-center gap-1.5">
                GroupStages
                <span className="text-[10px] font-normal bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">{t('test.modeBadge')}</span>
              </h1>
              <p className="text-[10px] text-fifa-muted leading-none">{t('test.modeSubtitle')}</p>
            </div>
          </div>

          {/* Desktop Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleTabClick(id)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors rounded-lg
                  ${activeTab === id
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'text-fifa-muted hover:text-white hover:bg-white/5'
                  }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-900/30 text-amber-400">
              <FlaskConical size={10} />
              Local
            </span>
            <button
              onClick={handleReset}
              title={t('test.resetTitle')}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg text-fifa-muted hover:text-white hover:bg-white/10 transition-colors"
            >
              <RotateCcw size={12} />
              {t('header.reset')}
            </button>
            <LanguageSwitcher />
          </div>

          <div className="md:hidden flex items-center gap-1">
            <LanguageSwitcher />
            <button
              className="text-fifa-muted hover:text-white"
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-fifa-border bg-fifa-card px-4 py-3 space-y-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { handleTabClick(id); setMenuOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium
                  ${activeTab === id ? 'bg-amber-500/20 text-amber-300' : 'text-fifa-muted hover:text-white'}`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
            <button
              onClick={handleReset}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-900/20"
            >
              <RotateCcw size={14} />
              {t('header.resetAll')}
            </button>
          </div>
        )}
      </header>

      {/* ── Main Content ── */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {TABS.find((tab) => tab.id === activeTab)?.label}
          </h2>
          <p className="text-sm text-fifa-muted mt-0.5">
            {t(`test.subtitle.${activeTab}`)}
          </p>
        </div>

        <div className="flex-1 min-w-0">
          {activeTab === 'groups' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Object.entries(groups).map(([key, { standings }]) => (
                <GroupTable
                  key={key}
                  groupKey={key}
                  standings={standings}
                  onGroupClick={navigateToScenario}
                  onTeamClick={(teamId, groupKey) => navigateToScenario(groupKey, teamId)}
                />
              ))}
            </div>
          )}

          {activeTab === 'thirds' && (
            <ThirdPlaceTable
              best8={best8}
              allThirds={allThirds}
              loading={false}
              apiAvailable={false}
              onTeamClick={(team) => navigateToScenario(team.group, team.id)}
            />
          )}

          {activeTab === 'scenarios' && (
            <ScenarioPage
              selectedGroupKey={scenarioGroupKey}
              onSelectGroup={(key) => { localStorage.setItem('gs_scenarioGroup', key); localStorage.removeItem('gs_scenarioTeam'); setScenarioGroupKey(key); setScenarioTeamId(null); setScenarioFromNav(false); }}
              selectedTeamId={scenarioTeamId}
              onSelectTeam={(id) => { if (id) localStorage.setItem('gs_scenarioTeam', id); else localStorage.removeItem('gs_scenarioTeam'); setScenarioTeamId(id); }}
              fromNavigation={scenarioFromNav}
              groups={groups}
              onScoreChange={handleScoreChange}
              allGroupStandings={allGroupStandings}
              thirdAnalysis={thirdAnalysis}
            />
          )}

          {activeTab === 'knockout' && (
            <BracketPage
              groups={groups}
              allGroupStandings={allGroupStandings}
              best8={best8}
              thirdAnalysis={thirdAnalysis}
            />
          )}

          {activeTab === 'draw' && <DrawSimulator />}
          {activeTab === 'rules' && <RulesPage />}
        </div>
      </main>

      <footer className="border-t border-fifa-border mt-8 py-4 text-center text-xs text-amber-400/50">
        {t('footer.testNotice')}
      </footer>
    </div>
  );
}
