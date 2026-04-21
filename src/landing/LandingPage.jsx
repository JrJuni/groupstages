import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import LandingHeader from './components/LandingHeader.jsx';
import Hero from './components/Hero.jsx';
import FeatureGrid from './components/FeatureGrid.jsx';
import HowItWorks from './components/HowItWorks.jsx';
import Footer from './components/Footer.jsx';

export default function LandingPage() {
  const { t } = useTranslation('landing');

  useEffect(() => {
    document.title = t('meta.title');
    const descTag = document.querySelector('meta[name="description"]');
    if (descTag) descTag.setAttribute('content', t('meta.description'));
  }, [t]);

  return (
    <div className="min-h-screen bg-fifa-dark text-fifa-text">
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
