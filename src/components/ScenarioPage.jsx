import React, { useState } from 'react';
import { ChevronRight, MapPin, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { getFairPlayPoints } from '../utils/rankings.js';
import { runBruteForce } from '../utils/scenarioComputer.js';
import { BASE_URL } from '../config.js';
import ShareButtons from './ShareButtons.jsx';

// ── 공유용 텍스트 생성 헬퍼 ───────────────────────────────
function makeStandingsMd(groupKey, standings) {
  let md = `## 조 ${groupKey} 순위표\n\n`;
  md += '| # | 팀 | 경 | 승 | 무 | 패 | 득실 | 승점 |\n|---|---|---|---|---|---|---|---|\n';
  standings.forEach((t, i) => {
    const gd = t.gd > 0 ? `+${t.gd}` : `${t.gd}`;
    md += `| ${i + 1} | ${t.flag || ''} ${t.name} | ${t.played} | ${t.won} | ${t.drawn} | ${t.lost} | ${gd} | **${t.pts}** |\n`;
  });
  return md;
}

function makeStandingsHtml(groupKey, standings) {
  let html = `<h3>조 ${groupKey} 순위표</h3><table border="1">`;
  html += '<tr><th>#</th><th>팀</th><th>경기</th><th>승</th><th>무</th><th>패</th><th>득실</th><th>승점</th></tr>';
  standings.forEach((t, i) => {
    const gd = t.gd >= 0 ? `+${t.gd}` : `${t.gd}`;
    html += `<tr><td>${i + 1}</td><td>${t.flag || ''} ${t.name}</td><td>${t.played}</td><td>${t.won}</td><td>${t.drawn}</td><td>${t.lost}</td><td>${gd}</td><td><b>${t.pts}</b></td></tr>`;
  });
  return html + '</table>';
}

function makeScenarioPanelMd(team, rank, bruteForce, standings) {
  const WDL = { W: '승', D: '무', L: '패' };
  const gd = team.gd >= 0 ? `+${team.gd}` : `${team.gd}`;
  let md = `## ${team.name} — 16강 진출 경우의 수\n\n`;
  md += `현재 **${rank}위** | ${team.played}경기 | **${team.pts}점** | 득실 ${gd} | 득점 ${team.gf}\n\n`;
  if (!bruteForce) { md += '모든 경기 완료\n'; return md; }

  const { rankProbabilities, topTwoProbability, thirdPlaceAdvancingProbability, matrix, otherMatch, teamIsHome } = bruteForce;
  md += '### 순위 확률\n\n| 순위 | 확률 |\n|---|---|\n';
  [1, 2, 3, 4].forEach(r => { if (rankProbabilities[r] > 0) md += `| ${r}위 | ${rankProbabilities[r]}% |\n`; });
  md += `\n1·2위 직접 진출: **${topTwoProbability}%**`;
  if (thirdPlaceAdvancingProbability > 0) md += ` | 3위 진출 가능: **${thirdPlaceAdvancingProbability}%**`;
  md += '\n\n';

  const hasOther = otherMatch !== null;
  const otherHomeTeam = otherMatch ? standings.find(t => t.id === otherMatch.home) : null;
  const otherAwayTeam = otherMatch ? standings.find(t => t.id === otherMatch.away) : null;
  const getOL = (o) => o === 'W' ? `${otherHomeTeam?.name} 승` : o === 'D' ? '다른 경기 무승부' : `${otherAwayTeam?.name} 승`;
  const cells = hasOther ? matrix : matrix.filter(c => c.otherWDL === 'W');

  const byTWDL = {};
  for (const c of cells.filter(c => c.definitive !== null)) {
    if (!byTWDL[c.definitive]) byTWDL[c.definitive] = {};
    if (!byTWDL[c.definitive][c.teamWDL]) byTWDL[c.definitive][c.teamWDL] = [];
    if (hasOther) byTWDL[c.definitive][c.teamWDL].push(c.otherWDL);
  }
  const condLines = [];
  for (const r of [1, 2, 3, 4]) {
    const m = byTWDL[r]; if (!m) continue;
    const parts = ['W', 'D', 'L'].filter(t => m[t]).map(twdl => {
      const myT = `${team.name} ${WDL[twdl]}`;
      if (!hasOther || m[twdl].length === 3) return hasOther ? `${myT} (결과 무관)` : myT;
      return `${myT} & ${m[twdl].map(o => getOL(o)).join(' 또는 ')}`;
    });
    if (parts.length) condLines.push(`**${r}위 확정**: ${parts.join(', 또는 ')}`);
  }
  if (condLines.length) {
    md += '### 조건별 예상 순위\n\n' + condLines.join('\n\n') + '\n';
    if (cells.some(c => c.definitive === null)) md += '\n*(득실차 따라 결정되는 경우 있음)*\n';
  }
  return md;
}

function makeScenarioPanelHtml(team, rank, bruteForce) {
  const gd = team.gd >= 0 ? `+${team.gd}` : `${team.gd}`;
  let html = `<h3>${team.name} — 16강 진출 경우의 수</h3>`;
  html += `<p>현재 <b>${rank}위</b> | ${team.played}경기 | <b>${team.pts}점</b> | 득실 ${gd} | 득점 ${team.gf}</p>`;
  if (!bruteForce) { return html + '<p>모든 경기 완료</p>'; }
  const { rankProbabilities, topTwoProbability, thirdPlaceAdvancingProbability } = bruteForce;
  html += '<h4>순위 확률</h4><table border="1"><tr><th>순위</th><th>확률</th></tr>';
  [1, 2, 3, 4].forEach(r => { if (rankProbabilities[r] > 0) html += `<tr><td>${r}위</td><td>${rankProbabilities[r]}%</td></tr>`; });
  html += `</table><p>1·2위 직접 진출: <b>${topTwoProbability}%</b>`;
  if (thirdPlaceAdvancingProbability > 0) html += ` | 3위 진출 가능: <b>${thirdPlaceAdvancingProbability}%</b>`;
  return html + '</p>';
}

const YellowCard = () => (
  <svg width="10" height="14" viewBox="0 0 10 14" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block' }}>
    <rect width="10" height="14" rx="1.5" fill="#FACC15" />
  </svg>
);

const DoubleYellowCard = () => (
  <svg width="20" height="17" viewBox="0 0 20 17" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block' }}>
    <g transform="rotate(-22, 7, 9)">
      <rect x="1" y="2" width="10" height="14" rx="1.5" fill="#CA8A04" />
    </g>
    <g transform="rotate(18, 14, 8)">
      <rect x="9" y="1" width="10" height="14" rx="1.5" fill="#FACC15" />
    </g>
  </svg>
);

const RedCard = () => (
  <svg width="10" height="14" viewBox="0 0 10 14" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block' }}>
    <rect width="10" height="14" rx="1.5" fill="#EF4444" />
  </svg>
);

function formatKST(iso) {
  if (!iso) return null;
  const d = new Date(new Date(iso).getTime() + 9 * 3_600_000);
  const mo = d.getUTCMonth() + 1;
  const da = d.getUTCDate();
  const dayName = ['일', '월', '화', '수', '목', '금', '토'][d.getUTCDay()];
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${mo}월 ${da}일(${dayName}) ${hh}:${mm} KST`;
}

const RANK_BG = {
  1: 'bg-green-900/40 border-l-2 border-green-500',
  2: 'bg-green-900/20 border-l-2 border-green-700',
  3: 'bg-yellow-900/20 border-l-2 border-yellow-600',
  4: 'bg-transparent',
};

const RANK_COLORS = {
  1: { bg: 'bg-emerald-900/60', text: 'text-emerald-300', border: 'border-emerald-600/50', bar: 'bg-emerald-600' },
  2: { bg: 'bg-green-900/50',   text: 'text-green-300',   border: 'border-green-600/40',   bar: 'bg-green-600' },
  3: { bg: 'bg-yellow-900/40',  text: 'text-yellow-300',  border: 'border-yellow-600/40',  bar: 'bg-yellow-500' },
  4: { bg: 'bg-red-900/40',     text: 'text-red-300',     border: 'border-red-600/40',     bar: 'bg-red-600' },
};

const WDL_KO = { W: '승', D: '무', L: '패' };

function TeamFlag({ team, size = 'sm' }) {
  const imgClass = size === 'sm' ? 'w-5 h-3.5' : 'w-7 h-5';
  return team.flagImg
    ? <img src={`${BASE_URL}${team.flagImg}`} alt={team.name} className={`${imgClass} object-cover rounded-sm shrink-0`} />
    : <span className="text-base leading-none">{team.flag}</span>;
}


function GroupStandingsTable({ standings, highlightId, onTeamClick }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-fifa-border/40">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-fifa-muted text-[11px] border-b border-fifa-border bg-white/5">
            <th className="px-2 py-2 text-left w-5">#</th>
            <th className="px-2 py-2 text-left">팀</th>
            <th className="px-1 py-2 text-center">경기</th>
            <th className="px-1 py-2 text-center">승</th>
            <th className="px-1 py-2 text-center">무</th>
            <th className="px-1 py-2 text-center">패</th>
            <th className="px-1 py-2 text-center">득</th>
            <th className="px-1 py-2 text-center">실</th>
            <th className="px-1 py-2 text-center">차</th>
            <th className="px-1 py-2 text-center font-bold">승점</th>
            <th className="px-1 py-2 text-center" title="옐로카드 (-1점)"><YellowCard /></th>
            <th className="px-1 py-2 text-center" title="옐로 누적 퇴장 (-3점)"><DoubleYellowCard /></th>
            <th className="px-1 py-2 text-center" title="직접 퇴장 레드카드 (-4점)"><RedCard /></th>
            <th className="px-1 py-2 text-center text-[10px] text-fifa-muted" title="페어플레이 포인트">FP</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((team, idx) => {
            const fp = getFairPlayPoints(team);
            const isHighlighted = team.id === highlightId;
            return (
              <tr
                key={team.id}
                className={`border-b border-fifa-border/30 ${RANK_BG[idx + 1] || ''} ${isHighlighted ? 'ring-1 ring-inset ring-sky-400/60' : ''}`}
              >
                <td className="px-2 py-1.5 text-fifa-muted">{idx + 1}</td>
                <td className="px-2 py-1.5">
                  <button
                    onClick={() => onTeamClick?.(team.id)}
                    className={`flex items-center gap-1.5 text-left group hover:opacity-80 transition-opacity ${isHighlighted ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    <TeamFlag team={team} />
                    <span className={`font-medium whitespace-nowrap ${isHighlighted ? 'text-sky-400' : 'text-white group-hover:text-sky-300'}`}>{team.name}</span>
                    {team.host && (
                      <span className="text-[9px] bg-fifa-gold/20 text-fifa-gold px-1 rounded">H</span>
                    )}
                    {isHighlighted && <ChevronRight size={10} className="text-sky-400 shrink-0" />}
                  </button>
                </td>
                <td className="px-1 py-1.5 text-center text-fifa-muted">{team.played}</td>
                <td className="px-1 py-1.5 text-center text-green-400">{team.won}</td>
                <td className="px-1 py-1.5 text-center">{team.drawn}</td>
                <td className="px-1 py-1.5 text-center text-red-400">{team.lost}</td>
                <td className="px-1 py-1.5 text-center">{team.gf}</td>
                <td className="px-1 py-1.5 text-center">{team.ga}</td>
                <td className={`px-1 py-1.5 text-center ${team.gd > 0 ? 'text-green-400' : team.gd < 0 ? 'text-red-400' : ''}`}>
                  {team.gd > 0 ? `+${team.gd}` : team.gd}
                </td>
                <td className="px-1 py-1.5 text-center font-bold text-white">{team.pts}</td>
                <td className="px-1 py-1.5 text-center text-yellow-400">{team.yc || 0}</td>
                <td className="px-1 py-1.5 text-center text-orange-400">{team.twoYR || 0}</td>
                <td className="px-1 py-1.5 text-center text-red-400">{team.dr || 0}</td>
                <td className={`px-1 py-1.5 text-center font-bold ${fp < 0 ? 'text-red-400' : 'text-fifa-muted'}`}>
                  {fp}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MatchRow({ match, standings, onScoreChange, highlightId }) {
  const homeTeam = standings.find((t) => t.id === match.home);
  const awayTeam = standings.find((t) => t.id === match.away);
  if (!homeTeam || !awayTeam) return null;

  const played = match.homeScore !== null && match.homeScore !== undefined &&
                 match.homeScore !== '' && match.awayScore !== null &&
                 match.awayScore !== undefined && match.awayScore !== '';

  const dateStr = formatKST(match.date);
  const isRelevant = highlightId && (match.home === highlightId || match.away === highlightId);

  return (
    <div className={`border-b border-fifa-border/20 last:border-0 ${played ? '' : 'opacity-80'} ${isRelevant ? 'bg-sky-400/5' : ''}`}>
      {dateStr && (
        <div className="flex items-center gap-2 px-4 pt-2 pb-0.5">
          <span className="text-[10px] text-fifa-gold font-medium">{dateStr}</span>
          {match.city && (
            <span className="flex items-center gap-0.5 text-[10px] text-fifa-muted">
              <MapPin size={9} />
              {match.city}
            </span>
          )}
          {isRelevant && !played && (
            <span className="ml-auto text-[9px] bg-sky-400/15 text-sky-400 px-1.5 py-0.5 rounded-full">관련 경기</span>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 py-2 px-4 text-sm">
        <div className="flex items-center gap-1.5 flex-1 justify-end">
          <span className={`text-xs sm:text-sm whitespace-nowrap hidden sm:inline ${match.home === highlightId ? 'text-sky-400 font-bold' : 'text-white'}`}>{homeTeam.name}</span>
          <TeamFlag team={homeTeam} />
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {played ? (
            <div className="flex items-center gap-1 bg-white/10 rounded px-3 py-1">
              <span className="font-bold text-white text-base w-5 text-right">{match.homeScore}</span>
              <span className="text-fifa-muted text-xs">:</span>
              <span className="font-bold text-white text-base w-5 text-left">{match.awayScore}</span>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-1 justify-start">
          <TeamFlag team={awayTeam} />
          <span className={`text-xs sm:text-sm whitespace-nowrap hidden sm:inline ${match.away === highlightId ? 'text-sky-400 font-bold' : 'text-white'}`}>{awayTeam.name}</span>
        </div>
      </div>
    </div>
  );
}

function MatchList({ matches, standings, groupKey, onScoreChange, highlightId }) {
  if (!matches?.length) return null;

  const sorted = [...matches].sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(a.date) - new Date(b.date);
  });

  let lastMatchday = null;
  const rows = [];
  sorted.forEach((match) => {
    const md = match.matchday;
    if (md && md !== lastMatchday) {
      rows.push(
        <div key={`md-${md}`} className="flex items-center gap-2 px-4 py-1.5 bg-white/5 border-b border-fifa-border/30">
          <span className="text-[10px] font-bold text-fifa-muted uppercase tracking-wider">
            경기일 {md}
          </span>
        </div>
      );
      lastMatchday = md;
    }
    rows.push(
      <MatchRow
        key={match.id}
        match={match}
        standings={standings}
        highlightId={highlightId}
        onScoreChange={(matchId, field, value) =>
          onScoreChange(groupKey, matchId, field, value)
        }
      />
    );
  });

  return <div className="card overflow-hidden">{rows}</div>;
}

// ── 브루트포스 결과 셀 ─────────────────────────────────
function RankCell({ breakdown, definitive }) {
  if (definitive !== null) {
    const c = RANK_COLORS[definitive];
    return (
      <div className={`flex items-center justify-center min-h-[44px] ${c.bg} border ${c.border}`}>
        <span className={`text-xs font-bold ${c.text}`}>{definitive}위</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col justify-center gap-0.5 p-1.5 min-h-[44px]">
      {breakdown.slice(0, 3).map(({ rank, pct }) => {
        const c = RANK_COLORS[rank];
        return (
          <div key={rank} className="flex items-center gap-1">
            <span className={`text-[9px] w-5 font-bold shrink-0 ${c.text}`}>{rank}위</span>
            <div className="flex-1 bg-white/5 rounded-full h-1 overflow-hidden">
              <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[9px] text-fifa-muted w-6 text-right">{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}

// ── 조건별 예상 순위 요약 ──────────────────────────────
function QualConditionSummary({ matrix, hasOther, otherHomeTeam, otherAwayTeam, teamName, currentStandings, teamId }) {
  const MY_LABEL = { W: '승', D: '무', L: '패' };
  // W/D/L별 팀 결과 하이라이트 색상
  const WDL_COLOR = { W: 'text-emerald-300', D: 'text-yellow-300', L: 'text-red-400' };
  const fmtGD = (gd) => gd >= 0 ? `+${gd}` : `${gd}`;

  const getOtherLabel = (owdl) => {
    if (owdl === 'W') return `${otherHomeTeam?.name} 승`;
    if (owdl === 'D') return '다른 경기 무승부';  // "무승부"만 쓰면 내 팀 결과로 오해 가능
    return `${otherAwayTeam?.name} 승`;
  };

  // 타 경기 없을 때: otherWDL별 셀이 동일 → 'W'만 대표로 사용
  const cells = hasOther ? matrix : matrix.filter(c => c.otherWDL === 'W');
  const myStats = currentStandings?.find(t => t.id === teamId);

  // 랭크별 조건 목록 — { teamWDL, otherText } 형태로 분리 저장
  const byRank = { 1: [], 2: [], 3: [], 4: [] };

  // 1) 확정 셀: teamWDL별로 묶어서 단순화
  const byTWDLDef = {};
  for (const c of cells.filter(c => c.definitive !== null)) {
    const key = c.definitive;
    if (!byTWDLDef[key]) byTWDLDef[key] = {};
    if (!byTWDLDef[key][c.teamWDL]) byTWDLDef[key][c.teamWDL] = [];
    if (hasOther) byTWDLDef[key][c.teamWDL].push(c.otherWDL);
  }
  for (const rank of [1, 2, 3, 4]) {
    const twdlMap = byTWDLDef[rank];
    if (!twdlMap) continue;
    for (const twdl of ['W', 'D', 'L']) {
      const owdls = twdlMap[twdl];
      if (!owdls && hasOther) continue;
      let otherText = null;
      if (hasOther && owdls.length === 3) otherText = '결과 무관';
      else if (hasOther) otherText = owdls.map(o => getOtherLabel(o)).join(' 또는 ');
      byRank[rank].push({ type: 'definitive', teamWDL: twdl, otherText });
    }
  }

  // 2) 혼조 셀: 세부 랭크별로 타이브레이커 정보 포함
  for (const cell of cells.filter(c => c.definitive === null)) {
    const otherText = hasOther ? getOtherLabel(cell.otherWDL) : null;
    const competitorId = cell.mixedCondition?.competitorId;
    const competitor = competitorId ? currentStandings?.find(t => t.id === competitorId) : null;
    const bestRank = Math.min(...cell.breakdown.map(b => b.rank));

    for (const { rank, pct } of cell.breakdown) {
      const isBetter = rank === bestRank;
      const tiebreaker = isBetter ? '득실차/다득점 우위 시' : '득실차/다득점 열세 시';
      const statsNote = (isBetter && competitor && myStats)
        ? `현재 ${teamName} 득실 ${fmtGD(myStats.gd)}, 득점 ${myStats.gf} / ${competitor.name} 득실 ${fmtGD(competitor.gd)}, 득점 ${competitor.gf}`
        : null;
      byRank[rank].push({ type: 'mixed', teamWDL: cell.teamWDL, otherText, tiebreaker, statsNote, pct });
    }
  }

  const RANK_COLOR = { 1: 'text-emerald-400', 2: 'text-green-400', 3: 'text-yellow-400', 4: 'text-red-400' };
  const RANK_LABEL = { 1: '1위', 2: '2위', 3: '3위', 4: '탈락' };

  const hasAny = Object.values(byRank).some(v => v.length > 0);
  if (!hasAny) return null;

  const renderCondLine = (cond, i) => {
    const teamPart = (
      <span className={`font-medium ${WDL_COLOR[cond.teamWDL]}`}>
        {teamName} {MY_LABEL[cond.teamWDL]}
      </span>
    );
    const otherPart = cond.otherText
      ? <span className="text-white/60"> & {cond.otherText}</span>
      : null;

    if (cond.type === 'definitive') {
      return (
        <div key={i} className="text-[11px]">
          {teamPart}{otherPart}
          {cond.otherText === '결과 무관' && null /* already appended */}
        </div>
      );
    }
    return (
      <div key={i} className="text-[11px]">
        {teamPart}{otherPart}
        <span className="text-white/50">, </span>
        <span className="text-sky-300/80">{cond.tiebreaker}</span>
        {cond.statsNote && (
          <div className="text-[10px] text-fifa-muted/60 mt-0.5 pl-1">{cond.statsNote}</div>
        )}
      </div>
    );
  };

  return (
    <div className="mt-2 pt-2 border-t border-fifa-border/20 space-y-2">
      <p className="text-[10px] text-fifa-muted/80 font-medium">조건별 예상 순위</p>
      {[1, 2, 3, 4].map(rank => {
        const conditions = byRank[rank];
        if (!conditions.length) return null;
        return (
          <div key={rank} className="flex items-start gap-2">
            <span className={`text-[11px] font-bold w-8 shrink-0 pt-0.5 ${RANK_COLOR[rank]}`}>{RANK_LABEL[rank]}</span>
            <div className="space-y-1 flex-1 min-w-0">
              {conditions.map((cond, i) => renderCondLine(cond, i))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── 브루트포스 시나리오 매트릭스 ──────────────────────
function ScenarioMatrix({ data, standings }) {
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

// ── 팀별 경우의 수 계산 ────────────────────────────────
function computeTeamScenarios(team, standings, matches) {
  const remaining = matches.filter(
    (m) => !m.played && (m.home === team.id || m.away === team.id)
  );
  const totalPlayed = matches.filter((m) => m.played).length;
  const maxPts = team.pts + remaining.length * 3;
  const rank = standings.findIndex((t) => t.id === team.id) + 1;
  const allGroupPlayed = matches.every((m) => m.played);

  // 진출 확정: 다른 팀 중 내 현재 승점을 초과할 수 있는 팀이 1팀 이하
  const canBeOvertakenBy = standings.filter((t) => {
    if (t.id === team.id) return false;
    const otherRemaining = matches.filter(
      (m) => !m.played && (m.home === t.id || m.away === t.id)
    ).length;
    return t.pts + otherRemaining * 3 > team.pts;
  });
  const isGuaranteedTop2 = canBeOvertakenBy.length <= 1;

  // 탈락 확정: 내 최대 승점보다 현재 승점이 높은 팀이 이미 2팀 이상
  const alreadyAhead = standings.filter(
    (t) => t.id !== team.id && t.pts > maxPts
  );
  const isEliminated = alreadyAhead.length >= 2;

  return { remaining, maxPts, rank, totalPlayed, allGroupPlayed, isGuaranteedTop2, isEliminated };
}

function TeamScenarioPanel({ team, standings, matches, teams }) {
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
            // bruteForce가 있으면 정확한 확률 기준, 없으면(전경기 완료) 기존 논리
            const isConfirmedTop2 = bruteForce
              ? bruteForce.topTwoProbability === 100
              : isGuaranteedTop2;
            // 잔여경기에 스코어가 이미 입력됐으면 live 중 → 유력 배지 숨김
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

export default function ScenarioPage({ selectedGroupKey, onSelectGroup, selectedTeamId, onSelectTeam, fromNavigation, groups, onScoreChange }) {
  const [selectorOpen, setSelectorOpen] = useState(true);
  const [matchOpen, setMatchOpen] = useState(false);
  const groupEntries = Object.entries(groups);

  React.useEffect(() => {
    if (selectedGroupKey) {
      // 다른 탭에서 넘어온 경우: 선택박스 접음, 일정 접음
      // 직접 선택한 경우: 선택박스 유지, 일정 펼침
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
            조·팀 선택
            {selectedGroupKey && (
              <span className="ml-2 text-white font-bold">
                — 조 {selectedGroupKey}
                {selectedTeam && <span className="text-sky-400"> · {selectedTeam.name}</span>}
                {' '}선택됨
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
                    {/* 조 헤더 (클릭 → 조 선택) */}
                    <button
                      onClick={() => { onSelectGroup(key); setSelectorOpen(false); }}
                      className={`flex items-center justify-between px-3 py-1.5 text-left transition-colors
                        ${isGroupSelected
                          ? 'bg-sky-400/20 hover:bg-sky-400/25'
                          : 'bg-white/5 hover:bg-white/10'}`}
                    >
                      <span className="text-xs font-bold text-white">조 {key}</span>
                      <ChevronRight size={11} className={isGroupSelected ? 'text-sky-400' : 'text-fifa-muted/40'} />
                    </button>

                    {/* 팀 목록 (클릭 → 팀 선택) */}
                    <div className="flex flex-col">
                      {standings.map((t) => {
                        const isTeamSelected = isGroupSelected && selectedTeamId === t.id;
                        return (
                          <button
                            key={t.id}
                            onClick={() => {
                              if (!isGroupSelected) onSelectGroup(key);
                              onSelectTeam(t.id);
                              setSelectorOpen(false);
                            }}
                            className={`flex items-center gap-2 px-3 py-2 text-left transition-colors border-t border-fifa-border/20
                              ${isTeamSelected
                                ? 'bg-sky-400/15 text-sky-300'
                                : 'hover:bg-white/8 text-fifa-muted hover:text-white'}`}
                          >
                            {t.flagImg
                              ? <img src={`${BASE_URL}${t.flagImg}`} alt={t.name} className="w-7 h-5 object-cover rounded-sm shrink-0" />
                              : <span className="text-base leading-none shrink-0">{t.flag}</span>}
                            <span className={`text-xs truncate ${isTeamSelected ? 'font-medium' : ''}`}>{t.name}</span>
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
            <span className="text-lg font-bold text-white">조 {selectedGroupKey}</span>
            <div className="flex gap-1">
              {selectedGroup.standings.map((t) => (
                <span key={t.id} title={t.name}>
                  {t.flagImg
                    ? <img src={`${BASE_URL}${t.flagImg}`} alt={t.name} className="w-6 h-4 object-cover rounded-sm" />
                    : <span>{t.flag}</span>}
                </span>
              ))}
            </div>
            {selectedTeam && (
              <>
                <ChevronRight size={14} className="text-fifa-muted" />
                <div className="flex items-center gap-1.5">
                  <TeamFlag team={selectedTeam} />
                  <span className="text-sm font-bold text-sky-400">{selectedTeam.name}</span>
                </div>
              </>
            )}
          </div>

          {/* 순위표 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-fifa-muted font-medium">순위표</p>
              <ShareButtons
                targetId="scenario-standings-box"
                generateMarkdown={() => makeStandingsMd(selectedGroupKey, selectedGroup.standings)}
                generateHtmlTable={() => makeStandingsHtml(selectedGroupKey, selectedGroup.standings)}
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
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />16강 진출</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />3위 경쟁</span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[10px] text-fifa-muted/60">
                <YellowCard /> <span>-1</span>
                <DoubleYellowCard /> <span>-3</span>
                <RedCard /> <span>-4</span>
                <span>페어플레이</span>
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
            />
          )}

          {/* 경기 일정 / 결과 (접기 가능) */}
          <div className="card overflow-hidden">
            <button
              onClick={() => setMatchOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-colors"
            >
              <span className="text-xs font-medium text-fifa-muted">
                {matchOpen ? '경기 일정 · 결과' : '경기 일정 · 결과 보기'}
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
          <p className="text-sm">위에서 조를 선택하거나, 조별리그 탭에서 팀을 클릭하세요</p>
        </div>
      )}
    </div>
  );
}
