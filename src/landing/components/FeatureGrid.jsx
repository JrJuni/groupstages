import React from 'react';
import { useTranslation } from 'react-i18next';
import { Calculator, Trophy, Shuffle, TrendingUp } from 'lucide-react';

const FEATURES = [
  { key: 'standings', icon: Calculator },
  { key: 'thirdPlace', icon: Trophy },
  { key: 'drawSim', icon: Shuffle },
  { key: 'predictor', icon: TrendingUp },
];

export default function FeatureGrid() {
  const { t } = useTranslation('landing');

  return (
    <section className="px-6 py-16 md:py-20 border-t border-fifa-border">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-fifa-text text-center mb-3">
          {t('features.title')}
        </h2>
        <p className="text-fifa-muted text-center mb-12">{t('features.subtitle')}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {FEATURES.map(({ key, icon: Icon }) => (
            <div
              key={key}
              className="bg-fifa-card border border-fifa-border rounded-xl p-6 hover:border-fifa-blue/50 transition-colors"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-fifa-blue/20 text-sky-400 mb-4">
                <Icon size={20} />
              </div>
              <h3 className="text-lg font-semibold text-fifa-text mb-2">
                {t(`features.items.${key}.title`)}
              </h3>
              <p className="text-sm text-fifa-muted leading-relaxed">
                {t(`features.items.${key}.desc`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
