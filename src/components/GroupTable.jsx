import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { BASE_URL } from '../config.js';
import { RANK_BG } from './scenario/shared.jsx';
import { useTeamName } from '../i18n/useTeamName.js';

export default function GroupTable({ groupKey, standings, onGroupClick, onTeamClick }) {
  const { t } = useTranslation('tables');
  const teamName = useTeamName();
  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-fifa-blue/20 border-b border-fifa-border">
        <button
          className="flex items-center gap-2 group hover:opacity-80 transition-opacity text-left min-w-0"
          onClick={() => onGroupClick && onGroupClick(groupKey)}
          title={t('groups.viewScenarioGroup', { group: groupKey })}
        >
          <span className="font-bold text-lg text-white shrink-0">{t('groups.title', { group: groupKey })}</span>
          <div className="flex gap-1 items-center shrink-0">
            {standings.map((tm) => {
              const tn = teamName(tm);
              return tm.flagImg
                ? <img key={tm.id} src={`${BASE_URL}${tm.flagImg}`} alt={tn} title={tn} className="w-5 h-3 object-cover rounded-sm" />
                : <span key={tm.id} className="text-sm" title={tn}>{tm.flag}</span>;
            })}
          </div>
          <ArrowRight size={12} className="text-fifa-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </button>
      </div>

      <table className="w-full text-sm table-fixed">
        <colgroup>
          <col style={{ width: '28px' }} />
          <col />
          <col style={{ width: '26px' }} />
          <col style={{ width: '26px' }} />
          <col style={{ width: '26px' }} />
          <col style={{ width: '26px' }} />
          <col style={{ width: '26px' }} />
          <col style={{ width: '34px' }} />
          <col style={{ width: '36px' }} />
        </colgroup>
        <thead>
          <tr className="text-fifa-muted text-xs border-b border-fifa-border">
            <th className="px-1 py-2 text-left">{t('groups.headers.rank')}</th>
            <th className="px-2 py-2 text-left">{t('groups.headers.team')}</th>
            <th className="px-1 py-2 text-center">{t('groups.headers.won')}</th>
            <th className="px-1 py-2 text-center">{t('groups.headers.drawn')}</th>
            <th className="px-1 py-2 text-center">{t('groups.headers.lost')}</th>
            <th className="px-1 py-2 text-center">{t('groups.headers.goalsFor')}</th>
            <th className="px-1 py-2 text-center">{t('groups.headers.goalsAgainst')}</th>
            <th className="px-1 py-2 text-center">{t('groups.headers.goalDiff')}</th>
            <th className="px-1 py-2 text-center font-bold">{t('groups.headers.points')}</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((team, idx) => (
            <tr
              key={team.id}
              className={`border-b border-fifa-border/30 transition-colors cursor-pointer hover:bg-white/10 ${RANK_BG[idx + 1] || ''}`}
              onClick={() => onTeamClick && onTeamClick(team.id, groupKey)}
              title={t('groups.viewScenarioTeam', { team: teamName(team) })}
            >
              <td className="px-1 py-2 text-fifa-muted text-xs text-center">{idx + 1}</td>
              <td className="px-2 py-2 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-medium text-white text-xs truncate">{teamName(team)}</span>
                  {team.host && (
                    <span className="shrink-0 text-[10px] bg-fifa-gold/20 text-fifa-gold px-1 rounded">H</span>
                  )}
                </div>
              </td>
              <td className="px-1 py-2 text-center text-xs text-green-400">{team.won}</td>
              <td className="px-1 py-2 text-center text-xs">{team.drawn}</td>
              <td className="px-1 py-2 text-center text-xs text-red-400">{team.lost}</td>
              <td className="px-1 py-2 text-center text-xs">{team.gf}</td>
              <td className="px-1 py-2 text-center text-xs">{team.ga}</td>
              <td className={`px-1 py-2 text-center text-xs ${team.gd > 0 ? 'text-green-400' : team.gd < 0 ? 'text-red-400' : ''}`}>
                {team.gd > 0 ? `+${team.gd}` : team.gd}
              </td>
              <td className="px-1 py-2 text-center text-xs font-bold text-white">{team.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
