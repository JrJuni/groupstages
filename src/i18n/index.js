/**
 * i18next 초기화
 * 5개 언어(ko, en, es, ja, zh) × 8개 네임스페이스 지원
 * 폴백: en
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// ── ko 네임스페이스 ──────────────────────────────────────
import koCommon from './locales/ko/common.json';
import koTables from './locales/ko/tables.json';
import koScenario from './locales/ko/scenario.json';
import koBracket from './locales/ko/bracket.json';
import koRules from './locales/ko/rules.json';
import koShare from './locales/ko/share.json';
import koMeta from './locales/ko/meta.json';
import koTeams from './locales/ko/teams.json';
import koLanding from './locales/ko/landing.json';

// ── en 네임스페이스 ──────────────────────────────────────
import enCommon from './locales/en/common.json';
import enTables from './locales/en/tables.json';
import enScenario from './locales/en/scenario.json';
import enBracket from './locales/en/bracket.json';
import enRules from './locales/en/rules.json';
import enShare from './locales/en/share.json';
import enMeta from './locales/en/meta.json';
import enTeams from './locales/en/teams.json';
import enLanding from './locales/en/landing.json';

// ── es 네임스페이스 ──────────────────────────────────────
import esCommon from './locales/es/common.json';
import esTables from './locales/es/tables.json';
import esScenario from './locales/es/scenario.json';
import esBracket from './locales/es/bracket.json';
import esRules from './locales/es/rules.json';
import esShare from './locales/es/share.json';
import esMeta from './locales/es/meta.json';
import esTeams from './locales/es/teams.json';
import esLanding from './locales/es/landing.json';

// ── ja 네임스페이스 ──────────────────────────────────────
import jaCommon from './locales/ja/common.json';
import jaTables from './locales/ja/tables.json';
import jaScenario from './locales/ja/scenario.json';
import jaBracket from './locales/ja/bracket.json';
import jaRules from './locales/ja/rules.json';
import jaShare from './locales/ja/share.json';
import jaMeta from './locales/ja/meta.json';
import jaTeams from './locales/ja/teams.json';
import jaLanding from './locales/ja/landing.json';

// ── zh 네임스페이스 ──────────────────────────────────────
import zhCommon from './locales/zh/common.json';
import zhTables from './locales/zh/tables.json';
import zhScenario from './locales/zh/scenario.json';
import zhBracket from './locales/zh/bracket.json';
import zhRules from './locales/zh/rules.json';
import zhShare from './locales/zh/share.json';
import zhMeta from './locales/zh/meta.json';
import zhTeams from './locales/zh/teams.json';
import zhLanding from './locales/zh/landing.json';

export const SUPPORTED_LANGS = ['ko', 'en', 'es', 'ja', 'zh'];
export const FALLBACK_LANG = 'en';
export const DEFAULT_NS = 'common';
export const NAMESPACES = ['common', 'tables', 'scenario', 'bracket', 'rules', 'share', 'meta', 'teams', 'landing'];

const resources = {
  ko: { common: koCommon, tables: koTables, scenario: koScenario, bracket: koBracket, rules: koRules, share: koShare, meta: koMeta, teams: koTeams, landing: koLanding },
  en: { common: enCommon, tables: enTables, scenario: enScenario, bracket: enBracket, rules: enRules, share: enShare, meta: enMeta, teams: enTeams, landing: enLanding },
  es: { common: esCommon, tables: esTables, scenario: esScenario, bracket: esBracket, rules: esRules, share: esShare, meta: esMeta, teams: esTeams, landing: esLanding },
  ja: { common: jaCommon, tables: jaTables, scenario: jaScenario, bracket: jaBracket, rules: jaRules, share: jaShare, meta: jaMeta, teams: jaTeams, landing: jaLanding },
  zh: { common: zhCommon, tables: zhTables, scenario: zhScenario, bracket: zhBracket, rules: zhRules, share: zhShare, meta: zhMeta, teams: zhTeams, landing: zhLanding },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: SUPPORTED_LANGS,
    fallbackLng: FALLBACK_LANG,
    defaultNS: DEFAULT_NS,
    ns: NAMESPACES,
    nonExplicitSupportedLngs: true, // ko-KR → ko, zh-CN → zh
    interpolation: {
      escapeValue: false, // React가 이미 이스케이프
    },
    detection: {
      // URL 경로(/wc2026/{lang}/...)에서 언어 감지는 LocaleGate가 직접 처리
      // 여기서는 첫 방문 시 폴백 감지만
      order: ['navigator', 'htmlTag'],
      caches: [],
    },
    debug: import.meta.env.DEV,
    saveMissing: import.meta.env.DEV,
    missingKeyHandler: (lngs, ns, key) => {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn(`[i18n] Missing key: ${ns}:${key} (lngs: ${lngs.join(',')})`);
      }
    },
  });

export default i18n;
