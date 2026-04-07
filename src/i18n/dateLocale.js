/**
 * i18n.language 코드 → BCP47 locale 매핑.
 * Intl 포맷터에 전달용.
 */
const LOCALE_MAP = {
  ko: 'ko-KR',
  en: 'en-US',
  es: 'es-ES',
  ja: 'ja-JP',
  zh: 'zh-CN',
};

export function bcp47(lang) {
  return LOCALE_MAP[lang] || 'en-US';
}
