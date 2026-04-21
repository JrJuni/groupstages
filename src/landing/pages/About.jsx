import React from 'react';
import { useTranslation } from 'react-i18next';
import LegalLayout, { LegalSection } from '../components/LegalLayout.jsx';

const SECTION_KEYS = [
  'mission', 'howBuilt', 'dataSources', 'unofficial', 'feedback',
];

export default function About() {
  const { t } = useTranslation('legal');

  return (
    <LegalLayout
      metaTitleKey="about.meta.title"
      metaDescKey="about.meta.description"
      title={t('about.title')}
    >
      <p className="text-fifa-text/90 whitespace-pre-line">{t('about.intro')}</p>
      {SECTION_KEYS.map((key) => (
        <LegalSection
          key={key}
          title={t(`about.sections.${key}.title`)}
          body={t(`about.sections.${key}.body`)}
        />
      ))}
    </LegalLayout>
  );
}
