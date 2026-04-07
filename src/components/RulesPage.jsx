import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, AlertCircle, Target, Swords, Star, Shuffle } from 'lucide-react';

const Section = ({ icon: Icon, title, color = 'text-fifa-gold', children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Icon size={18} className={color} />
          <span className="font-bold text-white text-sm">{title}</span>
        </div>
        {open ? <ChevronUp size={16} className="text-fifa-muted" /> : <ChevronDown size={16} className="text-fifa-muted" />}
      </button>
      {open && <div className="px-5 pb-5 text-sm text-fifa-muted space-y-3">{children}</div>}
    </div>
  );
};

const Row = ({ rank, label, sub }) => (
  <div className="flex items-start gap-3 py-2 border-b border-fifa-border/30 last:border-0">
    <span className="shrink-0 w-7 h-7 rounded-full bg-fifa-blue/30 text-white text-xs font-bold flex items-center justify-center mt-0.5">
      {rank}
    </span>
    <div>
      <span className="text-white font-medium">{label}</span>
      {sub && <p className="text-xs text-fifa-muted mt-0.5 leading-relaxed">{sub}</p>}
    </div>
  </div>
);

const FPRow = ({ card, pts }) => (
  <div className="flex items-center justify-between py-1.5 border-b border-fifa-border/20 last:border-0">
    <span>{card}</span>
    <span className="font-bold text-red-400">{pts}</span>
  </div>
);

export default function RulesPage() {
  const { t } = useTranslation('rules');

  const tiebreakerKeys = ['1', '2', '3', '4-6', '7', '8', '9'];
  const fpRowKeys = ['yellow', 'twoYellow', 'red', 'yellowRed'];
  const thirdRowKeys = ['1', '2', '3', '4', '5', '6'];
  const knockoutRowKeys = [
    { key: 'first', color: 'text-green-400' },
    { key: 'second', color: 'text-blue-400' },
    { key: 'third', color: 'text-yellow-400' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-4">

      {/* 헤더 박스 */}
      <div className="card px-5 py-4 flex items-start gap-3 bg-fifa-blue/10 border border-fifa-blue/30">
        <AlertCircle size={18} className="text-fifa-blue shrink-0 mt-0.5" />
        <p className="text-sm text-fifa-muted leading-relaxed">
          {t('intro.prefix')}<strong className="text-white">{t('intro.bold')}</strong>{t('intro.suffix')}
        </p>
      </div>

      {/* 순위 결정 방식 */}
      <Section icon={Target} title={t('tiebreakers.title')} color="text-blue-400">
        {tiebreakerKeys.map((k) => (
          <Row
            key={k}
            rank={k}
            label={t(`tiebreakers.rows.${k}.label`)}
            sub={t(`tiebreakers.rows.${k}.sub`)}
          />
        ))}
      </Section>

      {/* 페어플레이 */}
      <Section icon={Swords} title={t('fairPlay.title')} color="text-yellow-400" defaultOpen={false}>
        <p className="mb-2">{t('fairPlay.intro')}</p>
        <div className="rounded-lg border border-fifa-border/40 overflow-hidden text-xs">
          <div className="flex items-center justify-between px-4 py-2 bg-white/5 font-semibold text-white">
            <span>{t('fairPlay.header.card')}</span>
            <span>{t('fairPlay.header.points')}</span>
          </div>
          <div className="px-4 divide-y divide-fifa-border/20">
            {fpRowKeys.map((k) => (
              <FPRow key={k} card={t(`fairPlay.rows.${k}.card`)} pts={t(`fairPlay.rows.${k}.pts`)} />
            ))}
          </div>
        </div>
        <p className="text-xs mt-2 text-fifa-muted/70">{t('fairPlay.footer')}</p>
      </Section>

      {/* 3위팀 진출 */}
      <Section icon={Star} title={t('thirdPlace.title')} color="text-green-400" defaultOpen={false}>
        <p>
          {t('thirdPlace.intro.prefix')}<strong className="text-white">{t('thirdPlace.intro.bold')}</strong>{t('thirdPlace.intro.suffix')}
        </p>
        <div className="mt-3 space-y-2">
          <p className="text-white font-medium">{t('thirdPlace.subtitle')}</p>
          {thirdRowKeys.map((k) => (
            <Row key={k} rank={k} label={t(`thirdPlace.rows.${k}`)} />
          ))}
        </div>
        <p className="text-xs mt-3 bg-fifa-blue/10 border border-fifa-blue/20 rounded px-3 py-2 text-white/70">
          {t('thirdPlace.note')}
        </p>
      </Section>

      {/* 32강 진출 구조 */}
      <Section icon={Shuffle} title={t('knockout.title')} color="text-purple-400" defaultOpen={false}>
        <p>
          {t('knockout.intro.prefix')}<strong className="text-white">{t('knockout.intro.bold')}</strong>{t('knockout.intro.suffix')}
        </p>
        <div className="mt-3 text-xs rounded-lg border border-fifa-border/40 overflow-hidden">
          <div className="px-4 py-2 bg-white/5 font-semibold text-white">{t('knockout.tableHeader')}</div>
          <div className="divide-y divide-fifa-border/20">
            {knockoutRowKeys.map(({ key, color }) => (
              <div key={key} className="flex justify-between px-4 py-2">
                <span>{t(`knockout.rows.${key}.label`)}</span>
                <span className={`font-bold ${color}`}>{t(`knockout.rows.${key}.count`)}</span>
              </div>
            ))}
            <div className="flex justify-between px-4 py-2 bg-white/5 font-semibold text-white">
              <span>{t('knockout.total.label')}</span>
              <span>{t('knockout.total.count')}</span>
            </div>
          </div>
        </div>
        <p className="text-xs mt-3 text-fifa-muted/70">{t('knockout.note')}</p>
      </Section>

      {/* 출처 */}
      <p className="text-center text-xs text-fifa-muted/50 pb-2">
        {t('source')}
      </p>
    </div>
  );
}
