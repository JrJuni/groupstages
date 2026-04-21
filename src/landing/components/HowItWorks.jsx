import React from 'react';
import { useTranslation } from 'react-i18next';

export default function HowItWorks() {
  const { t } = useTranslation('landing');

  const steps = ['step1', 'step2', 'step3'];

  return (
    <section className="px-6 py-16 md:py-20 border-t border-fifa-border bg-fifa-card/30">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-fifa-text text-center mb-3">
          {t('howItWorks.title')}
        </h2>
        <p className="text-fifa-muted text-center mb-10">{t('howItWorks.subtitle')}</p>
        <div className="space-y-6">
          {steps.map((key, idx) => (
            <div key={key} className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-fifa-blue text-white text-sm font-bold flex items-center justify-center">
                {idx + 1}
              </div>
              <div>
                <h3 className="text-base font-semibold text-fifa-text mb-1">
                  {t(`howItWorks.${key}.title`)}
                </h3>
                <p className="text-sm text-fifa-muted leading-relaxed">
                  {t(`howItWorks.${key}.desc`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
