import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation('landing');
  const { lang } = useParams();

  const linkClass = 'text-fifa-muted hover:text-white transition-colors';

  return (
    <footer className="px-6 py-10 border-t border-fifa-border">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-fifa-muted">
        <div>{t('footer.copyright', { year: new Date().getFullYear() })}</div>
        <div className="flex items-center gap-5">
          <Link to={`/${lang}/privacy`} className={linkClass}>{t('footer.links.privacy')}</Link>
          <Link to={`/${lang}/terms`} className={linkClass}>{t('footer.links.terms')}</Link>
          <Link to={`/${lang}/about`} className={linkClass}>{t('footer.links.about')}</Link>
          <Link to={`/${lang}/contact`} className={linkClass}>{t('footer.links.contact')}</Link>
        </div>
      </div>
      <p className="max-w-5xl mx-auto mt-6 text-xs text-fifa-muted/60 text-center">
        {t('footer.disclaimer')}
      </p>
    </footer>
  );
}
