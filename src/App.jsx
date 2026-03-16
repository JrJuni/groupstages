import React, { useState, useCallback } from 'react';
import { Globe, Shuffle, Trophy, Share2, Menu, X } from 'lucide-react';
import { INITIAL_GROUPS } from './data/worldcup2026.js';
import {
  createInitialStandings,
  createInitialMatches,
  calculateStandings,
  getBest8ThirdPlace,
} from './utils/rankings.js';
import GroupTable from './components/GroupTable.jsx';
import ThirdPlaceTable from './components/ThirdPlaceTable.jsx';
import DrawSimulator from './components/DrawSimulator.jsx';
import ShareButtons from './components/ShareButtons.jsx';

// ── 초기 상태 생성 ──────────────────────────────────────
function buildInitialState() {
  const groups = {};
  Object.entries(INITIAL_GROUPS).forEach(([key, { teams }]) => {
    groups[key] = {
      teams,
      standings: createInitialStandings(teams),
      matches: createInitialMatches(teams),
    };
  });
  return groups;
}

// ── 탭 정의 ─────────────────────────────────────────────
const TABS = [
  { id: 'groups', label: '조별리그', icon: Globe },
  { id: 'thirds', label: '3위 순위', icon: Trophy },
  { id: 'draw', label: '조추첨', icon: Shuffle },
];

// ── Markdown 생성 ────────────────────────────────────────
function makeMarkdown(groups) {
  let md = '# 2026 FIFA World Cup - 조별리그 순위\n\n';
  Object.entries(groups).forEach(([key, { standings }]) => {
    md += `## 조 ${key}\n| # | 팀 | 경 | 승 | 무 | 패 | 득 | 실 | 차 | 승점 |\n|---|---|---|---|---|---|---|---|---|---|\n`;
    standings.forEach((t, i) => {
      md += `| ${i + 1} | ${t.flag} ${t.name} | ${t.played} | ${t.won} | ${t.drawn} | ${t.lost} | ${t.gf} | ${t.ga} | ${t.gd > 0 ? '+' : ''}${t.gd} | **${t.pts}** |\n`;
    });
    md += '\n';
  });
  return md;
}

function makeHtmlTable(groups) {
  let html = '';
  Object.entries(groups).forEach(([key, { standings }]) => {
    html += `<h3>조 ${key}</h3><table border="1"><tr><th>#</th><th>팀</th><th>경기</th><th>승</th><th>무</th><th>패</th><th>득실</th><th>승점</th></tr>`;
    standings.forEach((t, i) => {
      html += `<tr><td>${i + 1}</td><td>${t.flag} ${t.name}</td><td>${t.played}</td><td>${t.won}</td><td>${t.drawn}</td><td>${t.lost}</td><td>${t.gd >= 0 ? '+' : ''}${t.gd}</td><td><b>${t.pts}</b></td></tr>`;
    });
    html += `</table>`;
  });
  return html;
}

// ── 광고 슬롯 컴포넌트 ────────────────────────────────────
function AdSlot({ slot, className = '' }) {
  return (
    <div className={`w-full bg-fifa-card border border-dashed border-fifa-border/30 rounded-lg flex items-center justify-center text-fifa-border text-xs ${className}`}>
      광고 슬롯 ({slot})
    </div>
  );
}

// ── 메인 앱 ─────────────────────────────────────────────
export default function App() {
  const [groups, setGroups] = useState(() => buildInitialState());
  const [activeTab, setActiveTab] = useState('groups');
  const [menuOpen, setMenuOpen] = useState(false);

  // 경기 결과 변경 핸들러
  const handleScoreChange = useCallback((groupKey, matchId, field, value) => {
    setGroups((prev) => {
      const group = prev[groupKey];
      const newMatches = group.matches.map((m) => {
        if (m.id !== matchId) return m;
        const updated = { ...m, [field]: value };
        updated.played =
          updated.homeScore !== null &&
          updated.homeScore !== '' &&
          updated.awayScore !== null &&
          updated.awayScore !== '';
        return updated;
      });
      const newStandings = calculateStandings(group.teams, newMatches);
      return {
        ...prev,
        [groupKey]: { ...group, matches: newMatches, standings: newStandings },
      };
    });
  }, []);

  // 3위팀 목록
  const allGroupStandings = Object.fromEntries(
    Object.entries(groups).map(([k, v]) => [k, v.standings])
  );
  const allThirds = Object.entries(allGroupStandings)
    .map(([group, standings]) => {
      if (!standings || standings.length < 3) return null;
      return { group, ...standings[2] };
    })
    .filter((t) => t !== null && t.played > 0)
    .sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      return b.gf - a.gf;
    });
  const best8 = getBest8ThirdPlace(allGroupStandings);

  return (
    <div className="min-h-screen bg-fifa-dark">
      {/* ── 상단 광고 ─── */}
      <AdSlot slot="상단 배너 728×90" className="h-[60px] hidden md:flex" />
      <AdSlot slot="모바일 상단 320×50" className="h-[50px] md:hidden" />

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
                onClick={() => setActiveTab(id)}
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

          {/* Mobile Menu */}
          <button
            className="md:hidden text-fifa-muted hover:text-white"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t border-fifa-border bg-fifa-card px-4 py-3 space-y-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { setActiveTab(id); setMenuOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium
                  ${activeTab === id ? 'bg-fifa-blue/30 text-white' : 'text-fifa-muted hover:text-white'}`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ── Main Content ──────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Page Title */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">
              {TABS.find((t) => t.id === activeTab)?.label}
            </h2>
            <p className="text-sm text-fifa-muted mt-0.5">
              {activeTab === 'groups' && '12개 조, 48팀 조별 순위 실시간 계산'}
              {activeTab === 'thirds' && '12개 조 3위팀 중 상위 8팀 16강 진출 판별'}
              {activeTab === 'draw' && '포트 시스템 및 지리적 제약 조건 조추첨 시뮬레이션'}
            </p>
          </div>
          {activeTab !== 'draw' && (
            <ShareButtons
              targetId="main-content"
              generateMarkdown={() => makeMarkdown(groups)}
              generateHtmlTable={() => makeHtmlTable(groups)}
            />
          )}
        </div>

        <div className="flex gap-6">
          {/* ── 콘텐츠 영역 ── */}
          <div id="main-content" className="flex-1 min-w-0">
            {/* 조별리그 탭 */}
            {activeTab === 'groups' && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {Object.entries(groups).map(([key, { standings, matches }]) => (
                  <GroupTable
                    key={key}
                    groupKey={key}
                    standings={standings}
                    matches={matches}
                    onScoreChange={(matchId, field, value) =>
                      handleScoreChange(key, matchId, field, value)
                    }
                  />
                ))}
              </div>
            )}

            {/* 3위 순위 탭 */}
            {activeTab === 'thirds' && (
              <div className="space-y-4">
                <ThirdPlaceTable best8={best8} allThirds={allThirds} />

                {/* 중간 광고 */}
                <AdSlot slot="중간 배너 728×90" className="h-[90px]" />

                {/* 설명 박스 */}
                <div className="card p-4 text-sm text-fifa-muted space-y-2">
                  <h3 className="text-white font-semibold">🏆 3위팀 진출 규칙</h3>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>12개 조 각 3위팀 중 <strong className="text-white">상위 8팀</strong>이 16강 진출</li>
                    <li>우선순위: <strong className="text-white">승점 → 득실차 → 다득점 → 페어플레이</strong></li>
                    <li>동점 시 FIFA 규정에 따른 추가 기준 적용</li>
                  </ul>
                </div>
              </div>
            )}

            {/* 조추첨 탭 */}
            {activeTab === 'draw' && <DrawSimulator />}
          </div>

          {/* ── 사이드 광고 (데스크탑) ── */}
          <aside className="hidden lg:block w-[160px] shrink-0">
            <div className="sticky top-20 space-y-4">
              <AdSlot slot="사이드 160×600" className="h-[600px]" />
            </div>
          </aside>
        </div>

        {/* 하단 광고 */}
        <div className="mt-8">
          <AdSlot slot="하단 배너 728×90" className="h-[90px]" />
        </div>
      </main>

      {/* ── Footer ───────────────────────────────────── */}
      <footer className="border-t border-fifa-border mt-8 py-6 text-center text-xs text-fifa-muted">
        <p>GroupStages © 2026 · 2026 FIFA World Cup 경우의 수 계산기</p>
        <p className="mt-1">본 사이트는 FIFA와 공식 관련이 없습니다</p>
      </footer>
    </div>
  );
}
