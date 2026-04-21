import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Trophy, ArrowRight } from 'lucide-react';

export default function Hero() {
  const { t } = useTranslation('landing');
  const { lang } = useParams();

  return (
    <section className="relative px-6 py-20 md:py-28 text-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-fifa-blue/20 via-transparent to-transparent pointer-events-none" />
      <div className="relative max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fifa-gold/10 border border-fifa-gold/30 text-fifa-gold text-xs font-medium mb-6">
          <Trophy size={14} />
          <span>{t('hero.badge')}</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-fifa-text leading-tight mb-5">
          {t('hero.title')}
        </h1>
        <p className="text-lg md:text-xl text-fifa-muted mb-10 leading-relaxed">
          {t('hero.subtitle')}
        </p>
        <Link
          to={`/${lang}/wc2026`}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-fifa-blue hover:bg-fifa-blue/80 text-white font-semibold transition-colors shadow-lg shadow-fifa-blue/30"
        >
          {t('hero.cta')}
          <ArrowRight size={18} />
        </Link>
      </div>
    </section>
  );
}
