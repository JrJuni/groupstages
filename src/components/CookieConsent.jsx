import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCookieConsent } from '../hooks/useCookieConsent.js';
import { SUPPORTED_LANGS, FALLBACK_LANG } from '../i18n/index.js';

function extractLang(pathname) {
  const seg = pathname.split('/')[1];
  return SUPPORTED_LANGS.includes(seg) ? seg : FALLBACK_LANG;
}

export default function CookieConsent() {
  const { t } = useTranslation('common');
  const { consent, accept, reject } = useCookieConsent();
  const location = useLocation();

  if (consent !== null) return null;

  const lang = extractLang(location.pathname);

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t('cookie.title')}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-fifa-border bg-fifa-dark/95 backdrop-blur"
    >
      <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
        <div className="flex-1 text-sm text-fifa-text/90">
          <p className="font-semibold text-white mb-1">{t('cookie.title')}</p>
          <p className="text-fifa-muted leading-relaxed">
            {t('cookie.description')}{' '}
            <Link
              to={`/${lang}/privacy`}
              className="underline text-white/90 hover:text-white"
            >
              {t('cookie.learnMore')}
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={reject}
            className="px-4 py-2 text-sm rounded-md border border-fifa-border text-fifa-text hover:bg-white/5 transition-colors"
          >
            {t('cookie.reject')}
          </button>
          <button
            type="button"
            onClick={accept}
            className="px-4 py-2 text-sm rounded-md bg-fifa-blue text-white hover:bg-fifa-blue/90 transition-colors font-semibold"
          >
            {t('cookie.accept')}
          </button>
        </div>
      </div>
    </div>
  );
}
