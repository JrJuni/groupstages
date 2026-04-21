import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LandingHeader from './LandingHeader.jsx';
import Footer from './Footer.jsx';

export default function LegalLayout({ metaTitleKey, metaDescKey, title, lastUpdated, children }) {
  const { t } = useTranslation('legal');
  const { lang } = useParams();

  useEffect(() => {
    if (metaTitleKey) document.title = t(metaTitleKey);
    const descTag = document.querySelector('meta[name="description"]');
    if (descTag && metaDescKey) descTag.setAttribute('content', t(metaDescKey));
  }, [t, metaTitleKey, metaDescKey]);

  return (
    <div className="min-h-screen bg-fifa-dark text-fifa-text">
      <LandingHeader />
      <main className="px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <Link
            to={`/${lang}`}
            className="inline-flex items-center gap-1 text-sm text-fifa-muted hover:text-white transition-colors mb-6"
          >
            ← {t('nav.backToHome')}
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{title}</h1>
          {lastUpdated && (
            <p className="text-sm text-fifa-muted mb-8">{lastUpdated}</p>
          )}
          <div className="space-y-8 text-fifa-text leading-relaxed">
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export function LegalSection({ title, body }) {
  return (
    <section>
      <h2 className="text-xl md:text-2xl font-semibold text-white mb-3">{title}</h2>
      <p className="text-fifa-text/90 whitespace-pre-line">{body}</p>
    </section>
  );
}
