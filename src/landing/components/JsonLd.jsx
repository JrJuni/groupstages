import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

/**
 * Google Rich Results 지원을 위한 schema.org JSON-LD 삽입.
 * 랜딩 페이지에서만 렌더. 언어 변경 시 갱신.
 */
export default function JsonLd() {
  const { t } = useTranslation('landing');
  const { lang } = useParams();

  useEffect(() => {
    const ID = 'ld-json-groupstages';
    const existing = document.getElementById(ID);
    if (existing) existing.remove();

    const site = 'https://groupstages.com';
    const url = `${site}/${lang || 'en'}`;

    const website = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'GroupStages',
      url: site,
      inLanguage: lang || 'en',
      description: t('meta.description'),
    };

    const app = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'GroupStages',
      applicationCategory: 'SportsApplication',
      operatingSystem: 'Web',
      url,
      inLanguage: lang || 'en',
      description: t('meta.description'),
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      creator: {
        '@type': 'Organization',
        name: 'GroupStages',
        url: site,
      },
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = ID;
    script.text = JSON.stringify([website, app]);
    document.head.appendChild(script);

    return () => {
      const el = document.getElementById(ID);
      if (el) el.remove();
    };
  }, [t, lang]);

  return null;
}
