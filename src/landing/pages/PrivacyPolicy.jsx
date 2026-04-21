import React from 'react';
import { useTranslation } from 'react-i18next';
import LegalLayout, { LegalSection } from '../components/LegalLayout.jsx';

const SECTION_KEYS = [
  'collection', 'purpose', 'retention', 'thirdParties',
  'cookies', 'rights', 'children', 'changes', 'contact',
];

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
    </LegalLayout>
  );
}
