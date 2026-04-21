import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSeoMeta } from './useSeoMeta.js';

/**
 * 현재 언어에 맞춰 <title> 및 메타 태그를 동적으로 갱신.
 * App / TestApp 진입 시 한 번 호출.
 * canonical/hreflang/og:url/og:locale은 useSeoMeta가 처리.
 */
export function useDocumentMeta() {
  const { t, i18n } = useTranslation('meta');
  useSeoMeta();

  useEffect(() => {
    document.title = t('title');
    const setMeta = (selector, value) => {
      const el = document.querySelector(selector);
      if (el) el.setAttribute('content', value);
    };
    setMeta('meta[name="description"]', t('description'));
    setMeta('meta[property="og:title"]', t('ogTitle'));
    setMeta('meta[property="og:description"]', t('ogDescription'));
    setMeta('meta[name="twitter:title"]', t('ogTitle'));
    setMeta('meta[name="twitter:description"]', t('ogDescription'));
  }, [t, i18n.language]);
}
