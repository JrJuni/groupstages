import React from 'react';
import { useTranslation } from 'react-i18next';
import LegalLayout, { LegalSection } from '../components/LegalLayout.jsx';

const SECTION_KEYS = [
  'service', 'dataAccuracy', 'acceptableUse', 'intellectualProperty',
  'disclaimer', 'liability', 'changes', 'governing',
];

export default function TermsOfService() {
  const { t } = useTranslation('legal');

  return (
    <LegalLayout
      metaTitleKey="terms.meta.title"
      metaDescKey="terms.meta.description"
      title={t('terms.title')}
      lastUpdated={t('terms.lastUpdated')}
    >
      <p className="text-fifa-text/90 whitespace-pre-line">{t('terms.intro')}</p>
      {SECTION_KEYS.map((key) => (
        <LegalSection
          key={key}
          title={t(`terms.sections.${key}.title`)}
          body={t(`terms.sections.${key}.body`)}
        />
      ))}
    </LegalLayout>
  );
}
