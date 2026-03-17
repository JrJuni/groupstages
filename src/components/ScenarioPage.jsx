import React, { useState } from 'react';
import { ChevronRight, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { getFairPlayPoints } from '../utils/rankings.js';

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

function TeamFlag({ team, size = 'sm' }) {
  const imgClass = size === 'sm' ? 'w-5 h-3.5' : 'w-7 h-5';
  return team.flagImg
    ? <img src={team.flagImg} alt={team.name} className={`${imgClass} object-cover rounded-sm shrink-0`} />
    : <span className="text-base leading-none">{team.flag}</span>;
}

function CardInput({ value, onChange }) {
  return (
    <input
      type="number"
      min="0"
      max="99"
      className="score-input"
      style={{ width: '2rem' }}
      value={value || ''}
      placeholder="0"
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function GroupStandingsTable({ standings, onCardChange }) {
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
            {onCardChange && (
              <>
                <th className="px-1 py-2 text-center" title="옐로카드 (-1점)"><YellowCard /></th>
                <th className="px-1 py-2 text-center" title="옐로 누적 퇴장 (-3점)"><DoubleYellowCard /></th>
                <th className="px-1 py-2 text-center" title="직접 퇴장 레드카드 (-4점)"><RedCard /></th>
                <th className="px-1 py-2 text-center text-[10px] text-fifa-muted" title="페어플레이 포인트">FP</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {standings.map((team, idx) => {
            const fp = getFairPlayPoints(team);
            return (
              <tr
                key={team.id}
                className={`border-b border-fifa-border/30 ${RANK_BG[idx + 1] || ''}`}
              >
                <td className="px-2 py-1.5 text-fifa-muted">{idx + 1}</td>
                <td className="px-2 py-1.5">
                  <div className="flex items-center gap-1.5">
                    <TeamFlag team={team} />
                    <span className="font-medium text-white whitespace-nowrap">{team.name}</span>
                    {team.host && (
                      <span className="text-[9px] bg-fifa-gold/20 text-fifa-gold px-1 rounded">H</span>
                    )}
                  </div>
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
                {onCardChange && (
                  <>
                    <td className="px-0.5 py-1 text-center">
                      <CardInput value={team.yc} onChange={(v) => onCardChange(team.id, 'yc', v)} />
                    </td>
                    <td className="px-0.5 py-1 text-center">
                      <CardInput value={team.twoYR} onChange={(v) => onCardChange(team.id, 'twoYR', v)} />
                    </td>
                    <td className="px-0.5 py-1 text-center">
                      <CardInput value={team.dr} onChange={(v) => onCardChange(team.id, 'dr', v)} />
                    </td>
                    <td className={`px-1 py-1.5 text-center font-bold ${fp < 0 ? 'text-red-400' : 'text-fifa-muted'}`}>
                      {fp}
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MatchRow({ match, standings, onScoreChange }) {
  const homeTeam = standings.find((t) => t.id === match.home);
  const awayTeam = standings.find((t) => t.id === match.away);
  if (!homeTeam || !awayTeam) return null;

  const played = match.homeScore !== null && match.homeScore !== undefined &&
                 match.homeScore !== '' && match.awayScore !== null &&
                 match.awayScore !== undefined && match.awayScore !== '';

  const dateStr = formatKST(match.date);

  return (
    <div className={`border-b border-fifa-border/20 last:border-0 ${played ? '' : 'opacity-80'}`}>
      {dateStr && (
        <div className="flex items-center gap-2 px-4 pt-2 pb-0.5">
          <span className="text-[10px] text-fifa-gold font-medium">{dateStr}</span>
          {match.city && (
            <span className="flex items-center gap-0.5 text-[10px] text-fifa-muted">
              <MapPin size={9} />
              {match.city}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 py-2 px-4 text-sm">
        <div className="flex items-center gap-1.5 flex-1 justify-end">
          <span className="text-white text-xs sm:text-sm whitespace-nowrap hidden sm:inline">{homeTeam.name}</span>
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
          <span className="text-white text-xs sm:text-sm whitespace-nowrap hidden sm:inline">{awayTeam.name}</span>
        </div>
      </div>
    </div>
  );
}

function MatchList({ matches, standings, groupKey, onScoreChange }) {
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
        onScoreChange={(matchId, field, value) =>
          onScoreChange(groupKey, matchId, field, value)
        }
      />
    );
  });

  return <div className="card overflow-hidden">{rows}</div>;
}

export default function ScenarioPage({ selectedGroupKey, onSelectGroup, groups, onScoreChange, onCardChange }) {
  const [selectorOpen, setSelectorOpen] = useState(true);
  const groupEntries = Object.entries(groups);

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
              <span className="ml-2 text-white font-bold">— 조 {selectedGroupKey} 선택됨</span>
            )}
          </span>
          {selectorOpen
            ? <ChevronUp size={14} className="text-fifa-muted" />
            : <ChevronDown size={14} className="text-fifa-muted" />}
        </button>

        {selectorOpen && (
          <div className="px-4 pb-4 pt-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-2">
              {groupEntries.map(([key, { standings }]) => (
                <button
                  key={key}
                  onClick={() => { onSelectGroup(key); setSelectorOpen(false); }}
                  className={`flex flex-col items-start gap-1.5 px-3 py-2.5 rounded-lg border transition-all text-left
                    ${selectedGroupKey === key
                      ? 'bg-fifa-blue/30 border-fifa-blue/60 text-white'
                      : 'border-fifa-border/40 text-fifa-muted hover:border-fifa-blue/40 hover:bg-white/5'}`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">조 {key}</span>
                    {selectedGroupKey === key && <ChevronRight size={10} className="text-fifa-blue" />}
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {standings.map((t) => (
                      <span key={t.id} title={t.name}>
                        {t.flagImg
                          ? <img src={t.flagImg} alt={t.name} className="w-5 h-3.5 object-cover rounded-sm" />
                          : <span className="text-xs">{t.flag}</span>}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 선택된 조 상세 (수직 배치) ───────────────────── */}
      {selectedGroupKey && groups[selectedGroupKey] ? (
        <div className="space-y-4">
          {/* 섹션 헤더 */}
          <div className="flex items-center gap-2 pb-1 border-b border-fifa-border/30">
            <span className="text-lg font-bold text-white">조 {selectedGroupKey}</span>
            <div className="flex gap-1">
              {groups[selectedGroupKey].standings.map((t) => (
                <span key={t.id} title={t.name}>
                  {t.flagImg
                    ? <img src={t.flagImg} alt={t.name} className="w-6 h-4 object-cover rounded-sm" />
                    : <span>{t.flag}</span>}
                </span>
              ))}
            </div>
          </div>

          {/* 순위표 (전체 너비) */}
          <div>
            <p className="text-xs text-fifa-muted font-medium mb-2">
              순위표
              {onCardChange && (
                <span className="ml-2 inline-flex items-center gap-1.5 text-[10px] text-fifa-muted/60">
                  · <YellowCard /> <span>-1</span>
                  <DoubleYellowCard /> <span>-3</span>
                  <RedCard /> <span>-4</span>
                  <span>(페어플레이)</span>
                </span>
              )}
            </p>
            <GroupStandingsTable
              standings={groups[selectedGroupKey].standings}
              onCardChange={onCardChange
                ? (teamId, field, value) => onCardChange(selectedGroupKey, teamId, field, value)
                : null}
            />
            <div className="flex gap-4 mt-2 text-xs text-fifa-muted">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />16강 진출</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />3위 경쟁</span>
            </div>
          </div>

          {/* 경기 일정 / 결과 (전체 너비) */}
          <div>
            <p className="text-xs text-fifa-muted font-medium mb-2">경기 일정 · 결과</p>
            <MatchList
              matches={groups[selectedGroupKey].matches}
              standings={groups[selectedGroupKey].standings}
              groupKey={selectedGroupKey}
              onScoreChange={onScoreChange}
            />
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
