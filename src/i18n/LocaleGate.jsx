import React, { useEffect } from 'react';
import { useParams, Navigate, useLocation } from 'react-router-dom';
import i18n, { SUPPORTED_LANGS, FALLBACK_LANG } from './index.js';

/**
 * URL의 :lang 파라미터를 검증하고 i18n 언어를 동기화
 * - 지원 언어면 i18n.changeLanguage + documentElement.lang
 * - 미지원이면 /{FALLBACK_LANG}/...로 redirect
 */
export default function LocaleGate({ children }) {
  const { lang } = useParams();
  const location = useLocation();
  const isSupported = SUPPORTED_LANGS.includes(lang);

  useEffect(() => {
    if (isSupported && i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
    if (isSupported) {
      document.documentElement.lang = lang;
    }
  }, [lang, isSupported]);

  if (!isSupported) {
    // 현재 path에서 첫 segment(잘못된 lang)를 FALLBACK_LANG으로 교체
    const rest = location.pathname.split('/').slice(2).join('/');
    const target = `/${FALLBACK_LANG}/${rest}${location.search}${location.hash}`;
    return <Navigate to={target} replace />;
  }

  return children;
}
