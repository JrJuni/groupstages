import React from 'react';
import { useTranslation } from 'react-i18next';
import { RANK_COLORS } from './shared.jsx';

export default function RankCell({ breakdown, definitive }) {
  const { t } = useTranslation('scenario');
  if (definitive !== null) {
    const c = RANK_COLORS[definitive];
    return (
      <div className={`flex items-center justify-center min-h-[44px] ${c.bg} border ${c.border}`}>
        <span className={`text-xs font-bold ${c.text}`}>{t('matrix.rankLabel', { rank: definitive })}</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col justify-center gap-0.5 p-1.5 min-h-[44px]">
      {breakdown.slice(0, 3).map(({ rank, pct }) => {
        const c = RANK_COLORS[rank];
        return (
          <div key={rank} className="flex items-center gap-1">
            <span className={`text-[9px] w-5 font-bold shrink-0 ${c.text}`}>{t('matrix.rankLabel', { rank })}</span>
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
