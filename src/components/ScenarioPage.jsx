import React from 'react';
import { ChevronRight } from 'lucide-react';

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

function GroupStandingsTable({ standings }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-fifa-border/40">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-fifa-muted text-xs border-b border-fifa-border bg-white/5">
            <th className="px-3 py-2 text-left w-6">#</th>
            <th className="px-3 py-2 text-left">팀</th>
            <th className="px-2 py-2 text-center">경</th>
            <th className="px-2 py-2 text-center">승</th>
            <th className="px-2 py-2 text-center">무</th>
            <th className="px-2 py-2 text-center">패</th>
            <th className="px-2 py-2 text-center">득</th>
            <th className="px-2 py-2 text-center">실</th>
            <th className="px-2 py-2 text-center">차</th>
            <th className="px-2 py-2 text-center font-bold">승점</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((team, idx) => (
            <tr
              key={team.id}
              className={`border-b border-fifa-border/30 ${RANK_BG[idx + 1] || ''}`}
            >
              <td className="px-3 py-2 text-fifa-muted text-xs">{idx + 1}</td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <TeamFlag team={team} />
                  <span className="font-medium text-white text-xs sm:text-sm whitespace-nowrap">{team.name}</span>
                  {team.host && (
                    <span className="text-xs bg-fifa-gold/20 text-fifa-gold px-1 rounded">H</span>
                  )}
                </div>
              </td>
              <td className="px-2 py-2 text-center text-fifa-muted">{team.played}</td>
              <td className="px-2 py-2 text-center text-green-400">{team.won}</td>
              <td className="px-2 py-2 text-center">{team.drawn}</td>
              <td className="px-2 py-2 text-center text-red-400">{team.lost}</td>
              <td className="px-2 py-2 text-center">{team.gf}</td>
              <td className="px-2 py-2 text-center">{team.ga}</td>
              <td className={`px-2 py-2 text-center ${team.gd > 0 ? 'text-green-400' : team.gd < 0 ? 'text-red-400' : ''}`}>
                {team.gd > 0 ? `+${team.gd}` : team.gd}
              </td>
              <td className="px-2 py-2 text-center font-bold text-white">{team.pts}</td>
            </tr>
          ))}
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

  return (
    <div className={`flex items-center gap-3 py-2.5 px-4 border-b border-fifa-border/20 last:border-0 text-sm ${played ? '' : 'opacity-80'}`}>
      {/* 홈팀 */}
      <div className="flex items-center gap-1.5 flex-1 justify-end">
        <span className="text-white text-xs sm:text-sm whitespace-nowrap hidden sm:inline">{homeTeam.name}</span>
        <TeamFlag team={homeTeam} />
      </div>

      {/* 스코어 */}
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

      {/* 원정팀 */}
      <div className="flex items-center gap-1.5 flex-1 justify-start">
        <TeamFlag team={awayTeam} />
        <span className="text-white text-xs sm:text-sm whitespace-nowrap hidden sm:inline">{awayTeam.name}</span>
      </div>
    </div>
  );
}

export default function ScenarioPage({ selectedGroupKey, onSelectGroup, groups, onScoreChange }) {
  const groupEntries = Object.entries(groups);

  return (
    <div className="space-y-6">

      {/* ── 팀 선택 그리드 ───────────────────────────────── */}
      <div className="card p-4">
        <p className="text-xs text-fifa-muted mb-3 font-medium">조·팀 선택</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-2">
          {groupEntries.map(([key, { standings }]) => (
            <button
              key={key}
              onClick={() => onSelectGroup(key)}
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

      {/* ── 선택된 조 상세 ───────────────────────────────── */}
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

          <div className="grid md:grid-cols-2 gap-4 items-start">
            {/* 순위표 */}
            <div>
              <p className="text-xs text-fifa-muted font-medium mb-2">순위표</p>
              <GroupStandingsTable standings={groups[selectedGroupKey].standings} />
              <div className="flex gap-4 mt-2 text-xs text-fifa-muted">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />16강 진출</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />3위 경쟁</span>
              </div>
            </div>

            {/* 경기 일정 / 결과 */}
            <div>
              <p className="text-xs text-fifa-muted font-medium mb-2">경기 일정 · 결과</p>
              <div className="card overflow-hidden">
                {groups[selectedGroupKey].matches?.map((match) => (
                  <MatchRow
                    key={match.id}
                    match={match}
                    standings={groups[selectedGroupKey].standings}
                    onScoreChange={(matchId, field, value) =>
                      onScoreChange(selectedGroupKey, matchId, field, value)
                    }
                  />
                ))}
              </div>
            </div>
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
