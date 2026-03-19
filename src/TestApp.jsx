import React, { useState } from 'react';
import { Globe, Shuffle, Trophy, Menu, X, RotateCcw, GitBranch, BookOpen, FlaskConical, ExternalLink } from 'lucide-react';
import { getBest8ThirdPlace, getFairPlayPoints, calculateStandings } from './utils/rankings.js';
import { TEAM_SEEDS, FIFA_RANKINGS, FIFA_RANKINGS_CURRENT } from './data/worldcup2026.js';
import { useTestMatches } from './hooks/useTestMatches.js';
import GroupTable from './components/GroupTable.jsx';
import ThirdPlaceTable from './components/ThirdPlaceTable.jsx';
import ScenarioPage from './components/ScenarioPage.jsx';
import RulesPage from './components/RulesPage.jsx';
import DrawSimulator from './components/DrawSimulator.jsx';
import { Link } from 'react-router-dom';

const TABS = [
  { id: 'groups', label: '조별리그', icon: Globe },
  { id: 'scenarios', label: '경우의 수', icon: GitBranch },
  { id: 'thirds', label: '3위 순위', icon: Trophy },
  { id: 'draw', label: '조추첨', icon: Shuffle },
  { id: 'rules', label: '규칙', icon: BookOpen },
];

function computeThirdPtsRange({ teams, matches }) {
  const remaining = matches.filter(m => !m.played);
  if (remaining.length === 0) {
    const pts = calculateStandings(teams, matches)[2]?.pts ?? 0;
    return { min: pts, max: pts };
  }
  let minPts = Infinity, maxPts = -Infinity;
  function iter(idx, ms) {
    if (idx === remaining.length) {
      const pts = calculateStandings(teams, ms)[2]?.pts ?? 0;
      if (pts < minPts) minPts = pts;
      if (pts > maxPts) maxPts = pts;
      return;
    }
    const m = remaining[idx];
    for (const [h, a] of [['1','0'],['0','0'],['0','1']]) {
      iter(idx + 1, ms.map(x => x.id === m.id ? { ...x, homeScore: h, awayScore: a, played: true } : x));
    }
  }
  iter(0, matches);
  return { min: minPts === Infinity ? 0 : minPts, max: maxPts === -Infinity ? 0 : maxPts };
}

export default function TestApp() {
  const { groups, loading, apiAvailable, handleScoreChange, handleCardChange, resetAll } = useTestMatches();
  const [activeTab, setActiveTab] = useState('groups');
  const [menuOpen, setMenuOpen] = useState(false);
  const [scenarioGroupKey, setScenarioGroupKey] = useState(null);
  const [scenarioTeamId, setScenarioTeamId] = useState(null);
  const [scenarioFromNav, setScenarioFromNav] = useState(false);

  const navigateToScenario = (groupKey, teamId = null) => {
    setScenarioGroupKey(groupKey);
    setScenarioTeamId(teamId);
    setScenarioFromNav(true);
    setActiveTab('scenarios');
  };

  const allGroupStandings = Object.fromEntries(
    Object.entries(groups).map(([k, v]) => [k, v.standings])
  );
  const allThirds = Object.entries(allGroupStandings)
    .map(([group, standings]) => {
      if (!standings || standings.length < 3) return null;
      const t = standings[2];
      const { min: ptsMin, max: ptsMax } = computeThirdPtsRange(groups[group]);
      return { group, ...t, fifaRank: FIFA_RANKINGS_CURRENT[t.id] ?? null, ptsMin, ptsMax };
    })
    .filter((t) => t !== null)
    .sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      const fpA = getFairPlayPoints(a), fpB = getFairPlayPoints(b);
      if (fpB !== fpA) return fpB - fpA;
      const ra = FIFA_RANKINGS[a.id] ?? 999, rb = FIFA_RANKINGS[b.id] ?? 999;
      if (ra !== rb) return ra - rb;
      return (TEAM_SEEDS[a.id] ?? 99) - (TEAM_SEEDS[b.id] ?? 99);
    });
  const best8 = getBest8ThirdPlace(allGroupStandings);

  const handleReset = () => {
    if (!window.confirm('테스트 데이터를 초기화하시겠습니까?')) return;
    resetAll();
  };

  return (
    <div className="min-h-screen bg-fifa-dark">
      {/* ── TEST MODE 배너 ── */}
      <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-amber-400 text-xs font-medium">
          <FlaskConical size={13} />
          TEST MODE — API 없이 로컬 데이터 사용 중 · 새로고침 시 초기화
        </div>
        <Link
          to="/"
          className="flex items-center gap-1 text-xs text-amber-400/70 hover:text-amber-300 transition-colors"
        >
          <ExternalLink size={11} />
          메인으로
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
                <span className="text-[10px] font-normal bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">TEST</span>
              </h1>
              <p className="text-[10px] text-fifa-muted leading-none">2026 FIFA World Cup · 테스트 환경</p>
            </div>
          </div>

          {/* Desktop Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
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
              title="테스트 데이터 초기화"
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg text-fifa-muted hover:text-white hover:bg-white/10 transition-colors"
            >
              <RotateCcw size={12} />
              초기화
            </button>
          </div>

          <button
            className="md:hidden text-fifa-muted hover:text-white"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-fifa-border bg-fifa-card px-4 py-3 space-y-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { setActiveTab(id); setMenuOpen(false); }}
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
              전체 초기화
            </button>
          </div>
        )}
      </header>

      {/* ── Main Content ── */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {TABS.find((t) => t.id === activeTab)?.label}
          </h2>
          <p className="text-sm text-fifa-muted mt-0.5">
            {activeTab === 'groups' && '12개 조, 48팀 — 직접 점수 입력하여 테스트'}
            {activeTab === 'scenarios' && '경우의 수 계산 테스트'}
            {activeTab === 'thirds' && '3위팀 상위 8팀 선별 테스트'}
            {activeTab === 'draw' && '조추첨 시뮬레이터'}
            {activeTab === 'rules' && '순위 결정 규칙'}
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
              onSelectGroup={(key) => { setScenarioGroupKey(key); setScenarioTeamId(null); setScenarioFromNav(false); }}
              selectedTeamId={scenarioTeamId}
              onSelectTeam={setScenarioTeamId}
              fromNavigation={scenarioFromNav}
              groups={groups}
              onScoreChange={handleScoreChange}
            />
          )}

          {activeTab === 'draw' && <DrawSimulator />}
          {activeTab === 'rules' && <RulesPage />}
        </div>
      </main>

      <footer className="border-t border-fifa-border mt-8 py-4 text-center text-xs text-amber-400/50">
        TEST MODE · 이 페이지의 데이터는 실제 DB에 저장되지 않습니다
      </footer>
    </div>
  );
}
