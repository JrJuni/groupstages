import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import LandingHeader from './components/LandingHeader.jsx';
import Hero from './components/Hero.jsx';
import FeatureGrid from './components/FeatureGrid.jsx';
import HowItWorks from './components/HowItWorks.jsx';
import Footer from './components/Footer.jsx';
import JsonLd from './components/JsonLd.jsx';
import { useSeoMeta } from '../i18n/useSeoMeta.js';

export default function LandingPage() {
  const { t } = useTranslation('landing');
  useSeoMeta();

  useEffect(() => {
    document.title = t('meta.title');
    const descTag = document.querySelector('meta[name="description"]');
    if (descTag) descTag.setAttribute('content', t('meta.description'));
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', t('meta.title'));
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', t('meta.description'));
  }, [t]);

  return (
    <div className="min-h-screen bg-fifa-dark text-fifa-text">
      <JsonLd />
      <LandingHeader />
      <main>
        <Hero />
        <FeatureGrid />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  );
}
