import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTeamName } from '../../i18n/useTeamName.js';

export default function QualConditionSummary({ matrix, hasOther, otherHomeTeam, otherAwayTeam, teamName, currentStandings, teamId }) {
  const { t } = useTranslation('scenario');
  const getTeamName = useTeamName();
  const MY_LABEL = { W: t('qualSummary.wdl.W'), D: t('qualSummary.wdl.D'), L: t('qualSummary.wdl.L') };
  const WDL_COLOR = { W: 'text-emerald-300', D: 'text-yellow-300', L: 'text-red-400' };
  const fmtGD = (gd) => gd >= 0 ? `+${gd}` : `${gd}`;

  const getOtherLabel = (owdl) => {
    if (owdl === 'W') return t('qualSummary.otherWin', { team: otherHomeTeam ? getTeamName(otherHomeTeam) : '' });
    if (owdl === 'D') return t('qualSummary.otherDraw');
    return t('qualSummary.otherWin', { team: otherAwayTeam ? getTeamName(otherAwayTeam) : '' });
  };

  const cells = hasOther ? matrix : matrix.filter(c => c.otherWDL === 'W');
  const myStats = currentStandings?.find(t => t.id === teamId);

  const byRank = { 1: [], 2: [], 3: [], 4: [] };

  // 1) 확정 셀
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
      if (hasOther && owdls.length === 3) otherText = t('qualSummary.ignored');
      else if (hasOther) otherText = owdls.map(o => getOtherLabel(o)).join(t('qualSummary.or'));
      byRank[rank].push({ type: 'definitive', teamWDL: twdl, otherText });
    }
  }

  // 2) 혼조 셀
  for (const cell of cells.filter(c => c.definitive === null)) {
    const otherText = hasOther ? getOtherLabel(cell.otherWDL) : null;
    const competitorId = cell.mixedCondition?.competitorId;
    const competitor = competitorId ? currentStandings?.find(t => t.id === competitorId) : null;
    const bestRank = Math.min(...cell.breakdown.map(b => b.rank));

    for (const { rank, pct } of cell.breakdown) {
      const isBetter = rank === bestRank;
      const tiebreaker = isBetter ? t('qualSummary.tiebreakerBetter') : t('qualSummary.tiebreakerWorse');
      const statsNote = (isBetter && competitor && myStats)
        ? t('qualSummary.statsNote', {
            teamName,
            teamGd: fmtGD(myStats.gd),
            teamGf: myStats.gf,
            competitor: getTeamName(competitor),
            competitorGd: fmtGD(competitor.gd),
            competitorGf: competitor.gf,
          })
        : null;
      byRank[rank].push({ type: 'mixed', teamWDL: cell.teamWDL, otherText, tiebreaker, statsNote, pct });
    }
  }

  const RANK_COLOR = { 1: 'text-emerald-400', 2: 'text-green-400', 3: 'text-yellow-400', 4: 'text-red-400' };
  const RANK_LABEL = {
    1: t('qualSummary.rankLabels.1'),
    2: t('qualSummary.rankLabels.2'),
    3: t('qualSummary.rankLabels.3'),
    4: t('qualSummary.rankLabels.4'),
  };

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
      <p className="text-[10px] text-fifa-muted/80 font-medium">{t('qualSummary.title')}</p>
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
