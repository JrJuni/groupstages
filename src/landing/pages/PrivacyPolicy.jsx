import React from 'react';
import { useTranslation } from 'react-i18next';
import LegalLayout, { LegalSection } from '../components/LegalLayout.jsx';
import { useCookieConsent } from '../../hooks/useCookieConsent.js';

const SECTION_KEYS = [
  'collection', 'purpose', 'retention', 'thirdParties',
  'cookies', 'rights', 'children', 'changes', 'contact',
];

function ConsentResetPanel() {
  const { t } = useTranslation('common');
  const { consent, accept, reject, reset } = useCookieConsent();

  const statusKey = consent === 'granted'
    ? 'currentStatus.granted'
    : consent === 'denied'
      ? 'currentStatus.denied'
      : 'currentStatus.pending';

  return (
    <section className="mt-4 p-5 rounded-lg border border-fifa-border bg-white/5">
      <h2 className="text-xl font-semibold text-white mb-2">{t('cookie.resetTitle')}</h2>
      <p className="text-sm text-fifa-muted mb-3">{t('cookie.resetDescription')}</p>
      <p className="text-xs text-fifa-muted/80 mb-4">{t(statusKey)}</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={accept}
          className="px-3 py-1.5 text-sm rounded-md bg-fifa-blue text-white hover:bg-fifa-blue/90 font-semibold"
        >
          {t('cookie.accept')}
        </button>
        <button
          type="button"
          onClick={reject}
          className="px-3 py-1.5 text-sm rounded-md border border-fifa-border text-fifa-text hover:bg-white/5"
        >
          {t('cookie.reject')}
        </button>
        {consent !== null && (
          <button
            type="button"
            onClick={reset}
            className="px-3 py-1.5 text-sm rounded-md border border-fifa-border text-fifa-muted hover:text-white hover:bg-white/5"
          >
            {t('cookie.resetButton')}
          </button>
        )}
      </div>
    </section>
  );
}

export default function PrivacyPolicy() {
  const { t } = useTranslation('legal');

  return (
    <LegalLayout
      metaTitleKey="privacy.meta.title"
      metaDescKey="privacy.meta.description"
      title={t('privacy.title')}
      lastUpdated={t('privacy.lastUpdated')}
    >
      <p className="text-fifa-text/90 whitespace-pre-line">{t('privacy.intro')}</p>
      {SECTION_KEYS.map((key) => (
        <LegalSection
          key={key}
          title={t(`privacy.sections.${key}.title`)}
          body={t(`privacy.sections.${key}.body`)}
        />
      ))}
      <ConsentResetPanel />
    </LegalLayout>
  );
}
