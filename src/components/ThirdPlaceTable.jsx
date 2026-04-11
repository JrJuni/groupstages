import React from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, TrendingUp, Database, WifiOff } from 'lucide-react';
import { BASE_URL } from '../config.js';
import { useTeamName } from '../i18n/useTeamName.js';

export default function ThirdPlaceTable({ best8, allThirds, loading = false, apiAvailable = true, onTeamClick }) {
  const { t } = useTranslation(['tables', 'common']);
  const teamName = useTeamName();
  const qualifiedIds = new Set(best8.map((tm) => tm.id));

  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 bg-yellow-900/20 border-b border-fifa-border flex items-center gap-2 flex-wrap">
        <Trophy size={16} className="text-fifa-gold" />
        <span className="font-bold text-white">{t('thirds.title')}</span>
        <div className="flex items-center gap-2 ml-auto">
          <span
            title={apiAvailable ? t('thirds.dbTooltip') : t('thirds.localTooltip')}
            className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
              apiAvailable
                ? 'bg-green-900/30 text-green-400'
                : 'bg-gray-700/50 text-gray-400'
            }`}
          >
            {apiAvailable ? <Database size={9} /> : <WifiOff size={9} />}
            {apiAvailable ? t('common:header.dbLabel') : t('common:header.localLabel')}
          </span>
          <span className="text-xs text-fifa-muted">{t('thirds.confirmedCount', { count: best8.length })}</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-fifa-muted text-xs border-b border-fifa-border">
              <th className="px-3 py-2 text-left">{t('thirds.headers.rank')}</th>
              <th className="px-3 py-2 text-left">{t('thirds.headers.team')}</th>
              <th className="px-2 py-2 text-center">{t('thirds.headers.group')}</th>
              <th className="px-2 py-2 text-center">{t('thirds.headers.played')}</th>
              <th className="px-2 py-2 text-center">{t('thirds.headers.won')}</th>
              <th className="px-2 py-2 text-center">{t('thirds.headers.drawn')}</th>
              <th className="px-2 py-2 text-center">{t('thirds.headers.lost')}</th>
              <th className="px-2 py-2 text-center">{t('thirds.headers.goalDiff')}</th>
              <th className="px-2 py-2 text-center font-bold">{t('thirds.headers.points')}</th>
              <th className="px-2 py-2 text-center text-emerald-400" title={t('thirds.headerTooltips.ptsMax')}>{t('thirds.headers.ptsMax')}</th>
              <th className="px-2 py-2 text-center text-red-400" title={t('thirds.headerTooltips.ptsMin')}>{t('thirds.headers.ptsMin')}</th>
              <th className="px-2 py-2 text-center" title={t('thirds.headerTooltips.fifa')}>{t('thirds.headers.fifa')}</th>
              <th className="px-2 py-2 text-center whitespace-nowrap min-w-[88px]">{t('thirds.headers.status')}</th>
              <th className="px-2 py-2 text-left">{t('thirds.headers.nextMatch')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={14} className="text-center py-8 text-fifa-muted animate-pulse">
                  {t('thirds.loading')}
                </td>
              </tr>
            ) : allThirds.length === 0 ? (
              <tr>
                <td colSpan={14} className="text-center py-8 text-fifa-muted animate-pulse">
                  {t('thirds.loadingLocal')}
                </td>
              </tr>
            ) : (
              allThirds.map((team, idx) => {
                const isQualified = qualifiedIds.has(team.id);
                const ptsLocked = team.ptsMin === team.ptsMax;
                const isQualifiedConfirmed = team.qualified ?? false;
                const isEliminated = team.eliminated ?? false;
                return (
                  <tr
                    key={`${team.group}_${team.id}`}
                    className={`border-b border-fifa-border/30 transition-colors ${
                      isQualified
                        ? 'bg-green-900/20 hover:bg-green-900/30'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <td className="px-3 py-2 text-fifa-muted">{idx + 1}</td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => onTeamClick?.(team)}
                        className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity group cursor-pointer"
                      >
                        {team.flagImg
                          ? <img src={`${BASE_URL}${team.flagImg}`} alt={teamName(team)} className="w-6 h-4 object-cover rounded-sm shrink-0" />
                          : <span>{team.flag}</span>}
                        <span className="font-medium text-white group-hover:text-sky-300 transition-colors">{teamName(team)}</span>
                      </button>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <span className="bg-fifa-blue/30 text-white text-xs px-2 py-0.5 rounded font-bold">
                        {team.group}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-center text-fifa-muted">{team.played}</td>
                    <td className="px-2 py-2 text-center text-green-400">{team.won}</td>
                    <td className="px-2 py-2 text-center">{team.drawn}</td>
                    <td className="px-2 py-2 text-center text-red-400">{team.lost}</td>
                    <td className={`px-2 py-2 text-center ${team.gd > 0 ? 'text-green-400' : team.gd < 0 ? 'text-red-400' : ''}`}>
                      {team.gd > 0 ? `+${team.gd}` : team.gd}
                    </td>
                    <td className="px-2 py-2 text-center font-bold text-white">{team.pts}</td>
                    <td className="px-2 py-2 text-center text-xs">
                      {team.ptsMax != null
                        ? <span className={ptsLocked ? 'text-fifa-muted' : 'text-emerald-400 font-medium'}>{team.ptsMax}</span>
                        : <span className="text-fifa-muted">—</span>}
                    </td>
                    <td className="px-2 py-2 text-center text-xs">
                      {team.ptsMin != null
                        ? <span className={ptsLocked ? 'text-fifa-muted' : 'text-red-400 font-medium'}>{team.ptsMin}</span>
                        : <span className="text-fifa-muted">—</span>}
                    </td>
                    <td className="px-2 py-2 text-center text-fifa-muted text-xs">
                      {team.fifaRank ?? '—'}
                    </td>
                    <td className="px-2 py-2 text-center whitespace-nowrap">
                      {isQualifiedConfirmed ? (
                        <span className="text-xs bg-green-900/50 text-green-300 px-2 py-0.5 rounded-full font-bold border border-green-700/50 whitespace-nowrap">
                          {t('thirds.status.qualified')}
                        </span>
                      ) : isEliminated ? (
                        <span className="text-xs bg-red-900/50 text-red-300 px-2 py-0.5 rounded-full font-bold border border-red-700/50 whitespace-nowrap">
                          {t('thirds.status.eliminated')}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-2 py-2">
                      {team.nextOpponent ? (
                        <div className="flex items-center gap-1.5">
                          {team.nextOpponent.flagImg
                            ? <img src={`${BASE_URL}${team.nextOpponent.flagImg}`} alt={teamName(team.nextOpponent)} className="w-5 h-3.5 object-cover rounded-sm shrink-0" />
                            : <span className="text-sm leading-none">{team.nextOpponent.flag}</span>}
                          <span className="text-xs text-white whitespace-nowrap">{teamName(team.nextOpponent)}</span>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="px-4 py-3 border-t border-fifa-border/30 flex flex-wrap gap-4 text-xs text-fifa-muted">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-900/40 border border-green-500 rounded" />
          <span>{t('thirds.legend.qualified')}</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp size={12} />
          <span>{t('thirds.legend.tiebreaker')}</span>
        </div>
      </div>
    </div>
  );
}
