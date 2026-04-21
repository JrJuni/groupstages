import React from 'react';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation('landing');

  return (
    <footer className="px-6 py-10 border-t border-fifa-border">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-fifa-muted">
        <div>{t('footer.copyright', { year: new Date().getFullYear() })}</div>
        <div className="flex items-center gap-5">
          <span className="opacity-50">{t('footer.links.privacy')}</span>
          <span className="opacity-50">{t('footer.links.terms')}</span>
          <span className="opacity-50">{t('footer.links.about')}</span>
          <span className="opacity-50">{t('footer.links.contact')}</span>
        </div>
      </div>
      <p className="max-w-5xl mx-auto mt-6 text-xs text-fifa-muted/60 text-center">
        {t('footer.disclaimer')}
      </p>
    </footer>
  );
}
