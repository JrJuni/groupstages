import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Shuffle, Trophy, Share2, Menu, X, Database, RotateCcw, Wifi, WifiOff, GitBranch, BookOpen, Swords } from 'lucide-react';
import { getBest8ThirdPlace, getFairPlayPoints } from './utils/rankings.js';
import { analyzeThirdPlaceCombinations, computeThirdRange } from './utils/knockout.js';
import { leagueConfig } from './leagues/worldcup2026/index.js';
import { useMatches } from './hooks/useMatches.js';
import { usePredictor } from './hooks/usePredictor.js';
import { useLocalStorage, LS_KEYS } from './hooks/useLocalStorage.js';
import GroupTable from './components/GroupTable.jsx';
import ThirdPlaceTable from './components/ThirdPlaceTable.jsx';
import DrawSimulator from './components/DrawSimulator.jsx';
import ShareButtons from './components/ShareButtons.jsx';
import RulesPage from './components/RulesPage.jsx';
import ScenarioPage from './components/ScenarioPage.jsx';
import BracketPage from './components/knockout/BracketPage.jsx';
import LanguageSwitcher from './i18n/LanguageSwitcher.jsx';
import { useDocumentMeta } from './i18n/useDocumentMeta.js';
import { useTeamName } from './i18n/useTeamName.js';

// ── 탭 정의 (라벨은 컴포넌트 내부에서 t() 적용) ─────────────────
const TAB_DEFS = [
  { id: 'groups', icon: Globe },
  { id: 'scenarios', icon: GitBranch },
  { id: 'thirds', icon: Trophy },
  { id: 'knockout', icon: Swords },
  { id: 'draw', icon: Shuffle },
  { id: 'rules', icon: BookOpen },
];

// ── 3위 테이블 Markdown 생성 ─────────────────────────────
function makeThirdsMarkdown(allThirds, best8, { t, teamName }) {
  const qualifiedIds = new Set(best8.map((tm) => tm.id));
  let md = t('thirds.mdTitle') + '\n\n';
  const h = t('thirds.header', { returnObjects: true });
  md += `| ${h.rank} | ${h.team} | ${h.group} | ${h.played} | ${h.won} | ${h.drawn} | ${h.lost} | ${h.goalDiff} | ${h.points} | ${h.fifa} | ${h.status} |\n`;
  md += '|---|---|---|---|---|---|---|---|---|---|---|\n';
  allThirds.forEach((tm, i) => {
    const gd = tm.gd > 0 ? `+${tm.gd}` : tm.gd;
    const status = qualifiedIds.has(tm.id) ? t('thirds.statusQualified') : t('thirds.statusEliminated');
    md += `| ${i + 1} | ${tm.flag} ${teamName(tm)} | ${tm.group} | ${tm.played} | ${tm.won} | ${tm.drawn} | ${tm.lost} | ${gd} | **${tm.pts}** | ${tm.fifaRank ?? '—'} | ${status} |\n`;
  });
  return md;
}

function makeThirdsHtmlTable(allThirds, best8, { t, teamName }) {
  const qualifiedIds = new Set(best8.map((tm) => tm.id));
  let html = `<h3>${t('thirds.htmlTitle')}</h3>`;
  const h = t('thirds.header', { returnObjects: true });
  html += `<table border="1"><tr><th>${h.rank}</th><th>${h.team}</th><th>${h.group}</th><th>${h.playedFull}</th><th>${h.won}</th><th>${h.drawn}</th><th>${h.lost}</th><th>${h.goalDiff}</th><th>${h.points}</th><th>${h.fifa}</th><th>${h.status}</th></tr>`;
  allThirds.forEach((tm, i) => {
    const gd = tm.gd >= 0 ? `+${tm.gd}` : tm.gd;
    const status = qualifiedIds.has(tm.id) ? t('thirds.statusQualified') : t('thirds.statusEliminated');
    html += `<tr><td>${i + 1}</td><td>${tm.flag} ${teamName(tm)}</td><td>${tm.group}</td><td>${tm.played}</td><td>${tm.won}</td><td>${tm.drawn}</td><td>${tm.lost}</td><td>${gd}</td><td><b>${tm.pts}</b></td><td>${tm.fifaRank ?? '—'}</td><td>${status}</td></tr>`;
  });
  html += '</table>';
  return html;
}

// ── 조별리그 Markdown 생성 ────────────────────────────────
function makeMarkdown(groups, { t, teamName }) {
  let md = t('allGroups.mdTitle') + '\n\n';
  const h = t('allGroups.header', { returnObjects: true });
  Object.entries(groups).forEach(([key, { standings }]) => {
    md += `${t('allGroups.groupHeader', { group: key })}\n`;
    md += `| ${h.rank} | ${h.team} | ${h.played} | ${h.won} | ${h.drawn} | ${h.lost} | ${h.goalsFor} | ${h.goalsAgainst} | ${h.goalDiff} | ${h.points} |\n`;
    md += '|---|---|---|---|---|---|---|---|---|---|\n';
    standings.forEach((tm, i) => {
      md += `| ${i + 1} | ${tm.flag} ${teamName(tm)} | ${tm.played} | ${tm.won} | ${tm.drawn} | ${tm.lost} | ${tm.gf} | ${tm.ga} | ${tm.gd > 0 ? '+' : ''}${tm.gd} | **${tm.pts}** |\n`;
    });
    md += '\n';
  });
  return md;
}

function makeHtmlTable(groups, { t, teamName }) {
  let html = '';
  const h = t('allGroups.header', { returnObjects: true });
  Object.entries(groups).forEach(([key, { standings }]) => {
    html += `<h3>${t('allGroups.htmlGroupHeader', { group: key })}</h3><table border="1">`;
    html += `<tr><th>${h.rank}</th><th>${h.team}</th><th>${h.playedFull}</th><th>${h.won}</th><th>${h.drawn}</th><th>${h.lost}</th><th>${h.goalDiff}</th><th>${h.points}</th></tr>`;
    standings.forEach((tm, i) => {
      html += `<tr><td>${i + 1}</td><td>${tm.flag} ${teamName(tm)}</td><td>${tm.played}</td><td>${tm.won}</td><td>${tm.drawn}</td><td>${tm.lost}</td><td>${tm.gd >= 0 ? '+' : ''}${tm.gd}</td><td><b>${tm.pts}</b></td></tr>`;
    });
    html += `</table>`;
  });
  return html;
}

// ── 광고 슬롯 컴포넌트 ────────────────────────────────────
function AdSlot({ slot, className = '' }) {
  const { t } = useTranslation('common');
  return (
    <div className={`w-full bg-fifa-card border border-dashed border-fifa-border/30 rounded-lg flex items-center justify-center text-fifa-border text-xs ${className}`}>
      {t('ads.slot', { name: slot })}
    </div>
  );
}

// ── 메인 앱 ─────────────────────────────────────────────
export default function App() {
  const { t } = useTranslation('common');
  const { t: tShare } = useTranslation('share');
  const teamName = useTeamName();
  const shareCtx = { t: tShare, teamName };
  useDocumentMeta();
  const TABS = useMemo(
    () => TAB_DEFS.map((tab) => ({ ...tab, label: t(`tabs.${tab.id}`) })),
    [t]
  );
  const { groups, loading, apiAvailable, handleScoreChange, handleCardChange, resetAll } = useMatches(leagueConfig);
  const { predictor } = usePredictor(leagueConfig);
  const [activeTab, setActiveTab] = useLocalStorage(LS_KEYS.ACTIVE_TAB, 'groups');
  const [menuOpen, setMenuOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [scenarioGroupKey, setScenarioGroupKey] = useLocalStorage(LS_KEYS.SCENARIO_GROUP);
  const [scenarioTeamId, setScenarioTeamId] = useLocalStorage(LS_KEYS.SCENARIO_TEAM);
  const [scenarioFromNav, setScenarioFromNav] = useState(false);

  const handleTabClick = (id) => {
    if (id === 'scenarios') {
      setScenarioGroupKey(null);
      setScenarioTeamId(null);
      setScenarioFromNav(false);
    }
    setActiveTab(id);
  };

  const navigateToScenario = (groupKey, teamId = null) => {
    setScenarioGroupKey(groupKey);
    setScenarioTeamId(teamId);
    setScenarioFromNav(true);
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

  // 3위 분석 (단일 소스): 유효 조합 + 확정/탈락 + 슬롯 배정
  const thirdAnalysis = useMemo(
    () => analyzeThirdPlaceCombinations(groups),
    [groups]
  );

  // 3위팀 목록 (승점 범위는 engine의 computeThirdRange 사용)
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

  const handleReset = async () => {
    if (!window.confirm(t('dialog.confirmReset'))) return;
    setResetting(true);
    await resetAll();
    setResetting(false);
  };

  return (
    <div className="min-h-screen bg-fifa-dark">
      {/* ── 상단 광고 ─── */}
      <AdSlot slot={t('ads.topBanner')} className="h-[60px] hidden md:flex" />
      <AdSlot slot={t('ads.mobileTop')} className="h-[50px] md:hidden" />

      {/* ── Header ────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-fifa-dark/95 backdrop-blur border-b border-fifa-border">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚽</span>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">GroupStages</h1>
              <p className="text-[10px] text-fifa-muted leading-none">2026 FIFA World Cup</p>
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
                    ? 'bg-fifa-blue/30 text-white'
                    : 'text-fifa-muted hover:text-white hover:bg-white/5'
                  }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </nav>

          {/* DB 상태 + 초기화 버튼 + 언어 스위처 */}
          <div className="hidden md:flex items-center gap-2">
            <span
              title={apiAvailable ? t('header.dbConnected') : t('header.dbDisconnected')}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                apiAvailable
                  ? 'bg-green-900/30 text-green-400'
                  : 'bg-red-900/30 text-red-400'
              }`}
            >
              <Database size={10} />
              {apiAvailable ? t('header.dbLabel') : t('header.localLabel')}
            </span>
            <button
              onClick={handleReset}
              disabled={resetting}
              title={t('header.resetTitle')}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg text-fifa-muted hover:text-white hover:bg-white/10 transition-colors"
            >
              <RotateCcw size={12} />
              {t('header.reset')}
            </button>
            <LanguageSwitcher />
          </div>

          {/* Mobile: 언어 스위처 + 메뉴 */}
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

        {/* Mobile Menu Dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t border-fifa-border bg-fifa-card px-4 py-3 space-y-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { handleTabClick(id); setMenuOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium
                  ${activeTab === id ? 'bg-fifa-blue/30 text-white' : 'text-fifa-muted hover:text-white'}`}
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

      {/* ── Main Content ──────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Page Title */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {TABS.find((tab) => tab.id === activeTab)?.label}
              {loading && (
                <span className="text-xs font-normal text-fifa-muted animate-pulse">{t('header.loading')}</span>
              )}
            </h2>
            <p className="text-sm text-fifa-muted mt-0.5">
              {t(`subtitle.${activeTab}`)}
            </p>
          </div>
          {activeTab === 'groups' && (
            <ShareButtons
              targetId="main-content"
              generateMarkdown={() => makeMarkdown(groups, shareCtx)}
              generateHtmlTable={() => makeHtmlTable(groups, shareCtx)}
            />
          )}
          {activeTab === 'thirds' && (
            <ShareButtons
              targetId="thirds-content"
              generateMarkdown={() => makeThirdsMarkdown(allThirds, best8, shareCtx)}
              generateHtmlTable={() => makeThirdsHtmlTable(allThirds, best8, shareCtx)}
            />
          )}
        </div>

        <div className="flex gap-6">
          {/* ── 콘텐츠 영역 ── */}
          <div id="main-content" className="flex-1 min-w-0">
            {/* 조별리그 탭 */}
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

            {/* 3위 순위 탭 */}
            {activeTab === 'thirds' && (
              <div id="thirds-content" className="space-y-4">
                <ThirdPlaceTable
                  best8={best8}
                  allThirds={allThirds}
                  loading={loading}
                  apiAvailable={apiAvailable}
                  onTeamClick={(team) => navigateToScenario(team.group, team.id)}
                />

                {/* 중간 광고 */}
                <AdSlot slot={t('ads.middleBanner')} className="h-[90px]" />
              </div>
            )}

            {/* 경우의 수 탭 */}
            {activeTab === 'scenarios' && (
              <ScenarioPage
                selectedGroupKey={scenarioGroupKey}
                onSelectGroup={(key) => { setScenarioGroupKey(key); setScenarioTeamId(null); setScenarioFromNav(false); }}
                selectedTeamId={scenarioTeamId}
                onSelectTeam={(id) => setScenarioTeamId(id)}
                fromNavigation={scenarioFromNav}
                groups={groups}
                onScoreChange={handleScoreChange}
                allGroupStandings={allGroupStandings}
                thirdAnalysis={thirdAnalysis}
                predictor={predictor}
              />
            )}

            {/* 토너먼트 탭 */}
            {activeTab === 'knockout' && (
              <BracketPage
                groups={groups}
                allGroupStandings={allGroupStandings}
                best8={best8}
                thirdAnalysis={thirdAnalysis}
              />
            )}

            {/* 조추첨 탭 */}
            {activeTab === 'draw' && <DrawSimulator />}

            {/* 규칙 탭 */}
            {activeTab === 'rules' && <RulesPage />}
          </div>

          {/* ── 사이드 광고 (데스크탑, 토너먼트 탭에서는 숨김) ── */}
          {activeTab !== 'knockout' && (
            <aside className="hidden lg:block w-[160px] shrink-0">
              <div className="sticky top-20 space-y-4">
                <AdSlot slot={t('ads.sideBanner')} className="h-[600px]" />
              </div>
            </aside>
          )}
        </div>

        {/* 하단 광고 */}
        <div className="mt-8">
          <AdSlot slot={t('ads.bottomBanner')} className="h-[90px]" />
        </div>
      </main>

      {/* ── Footer ───────────────────────────────────── */}
      <footer className="border-t border-fifa-border mt-8 py-6 text-center text-xs text-fifa-muted">
        <p>{t('footer.copyright')}</p>
        <p className="mt-1">{t('footer.disclaimer')}</p>
      </footer>
    </div>
  );
}
