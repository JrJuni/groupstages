import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { getFairPlayPoints } from '../../utils/rankings.js';
import { RANK_BG, TeamFlag, YellowCard, DoubleYellowCard, RedCard } from './shared.jsx';
import { useTeamName } from '../../i18n/useTeamName.js';
import { leagueConfig } from '../../leagues/worldcup2026/index.js';

export default function GroupStandingsTable({ standings, highlightId, onTeamClick }) {
  const { t } = useTranslation('scenario');
  const teamName = useTeamName();
  return (
    <div className="overflow-x-auto rounded-lg border border-fifa-border/40">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-fifa-muted text-[11px] border-b border-fifa-border bg-white/5">
            <th className="px-2 py-2 text-left w-5">{t('standings.headers.rank')}</th>
            <th className="px-2 py-2 text-left">{t('standings.headers.team')}</th>
            <th className="px-1 py-2 text-center">{t('standings.headers.played')}</th>
            <th className="px-1 py-2 text-center">{t('standings.headers.won')}</th>
            <th className="px-1 py-2 text-center">{t('standings.headers.drawn')}</th>
            <th className="px-1 py-2 text-center">{t('standings.headers.lost')}</th>
            <th className="px-1 py-2 text-center">{t('standings.headers.goalsFor')}</th>
            <th className="px-1 py-2 text-center">{t('standings.headers.goalsAgainst')}</th>
            <th className="px-1 py-2 text-center">{t('standings.headers.goalDiff')}</th>
            <th className="px-1 py-2 text-center font-bold">{t('standings.headers.points')}</th>
            <th className="px-1 py-2 text-center" title={t('standings.cardTooltips.yc')}><YellowCard /></th>
            <th className="px-1 py-2 text-center" title={t('standings.cardTooltips.twoYR')}><DoubleYellowCard /></th>
            <th className="px-1 py-2 text-center" title={t('standings.cardTooltips.dr')}><RedCard /></th>
            <th className="px-1 py-2 text-center text-[10px] text-fifa-muted" title={t('standings.cardTooltips.fp')}>{t('standings.headers.fp')}</th>
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
                    <span className={`font-medium whitespace-nowrap ${isHighlighted ? 'text-sky-400' : 'text-white group-hover:text-sky-300'}`}>
                      {teamName(team)}
                      {leagueConfig.rankings[team.id] && <span className="text-[10px] text-fifa-muted font-normal ml-0.5">({leagueConfig.rankings[team.id]})</span>}
                    </span>
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
