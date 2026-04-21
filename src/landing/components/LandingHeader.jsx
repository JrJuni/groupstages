import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../i18n/LanguageSwitcher.jsx';

export default function LandingHeader() {
  const { t } = useTranslation('landing');
  const { lang } = useParams();

  return (
    <header className="px-6 py-4 border-b border-fifa-border bg-fifa-dark/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <Link to={`/${lang}`} className="text-fifa-text font-bold text-lg tracking-tight">
          GroupStages
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to={`/${lang}/wc2026`}
            className="hidden sm:inline text-sm text-fifa-muted hover:text-white transition-colors"
          >
            {t('header.openApp')}
          </Link>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
