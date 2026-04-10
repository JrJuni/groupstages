import React from 'react';
import { BASE_URL } from '../../config.js';

// ── 상수 ────────────────────────────────────────────────
export const RANK_BG = {
  1: 'bg-green-900/40 border-l-2 border-green-500',
  2: 'bg-green-900/20 border-l-2 border-green-700',
  3: 'bg-yellow-900/20 border-l-2 border-yellow-600',
  4: 'bg-transparent',
};

export const RANK_COLORS = {
  1: { bg: 'bg-emerald-900/60', text: 'text-emerald-300', border: 'border-emerald-600/50', bar: 'bg-emerald-600' },
  2: { bg: 'bg-green-900/50',   text: 'text-green-300',   border: 'border-green-600/40',   bar: 'bg-green-600' },
  3: { bg: 'bg-yellow-900/40',  text: 'text-yellow-300',  border: 'border-yellow-600/40',  bar: 'bg-yellow-500' },
  4: { bg: 'bg-red-900/40',     text: 'text-red-300',     border: 'border-red-600/40',     bar: 'bg-red-600' },
};

// ── 날짜 포맷 ───────────────────────────────────────────
// 사용자 로컬 시간대로 표시 (브라우저 기본 timeZone 사용)
const formatterCache = {};
function getFormatter(locale) {
  if (!formatterCache[locale]) {
    formatterCache[locale] = new Intl.DateTimeFormat(locale, {
      month: 'numeric',
      day: 'numeric',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZoneName: 'short',
    });
  }
  return formatterCache[locale];
}

export function formatLocalTime(iso, locale = 'ko-KR') {
  if (!iso) return null;
  return getFormatter(locale).format(new Date(iso));
}

// ── 카드 아이콘 ─────────────────────────────────────────
export const YellowCard = () => (
  <svg width="10" height="14" viewBox="0 0 10 14" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block' }}>
    <rect width="10" height="14" rx="1.5" fill="#FACC15" />
  </svg>
);

export const DoubleYellowCard = () => (
  <svg width="20" height="17" viewBox="0 0 20 17" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block' }}>
    <g transform="rotate(-22, 7, 9)">
      <rect x="1" y="2" width="10" height="14" rx="1.5" fill="#CA8A04" />
    </g>
    <g transform="rotate(18, 14, 8)">
      <rect x="9" y="1" width="10" height="14" rx="1.5" fill="#FACC15" />
    </g>
  </svg>
);

export const RedCard = () => (
  <svg width="10" height="14" viewBox="0 0 10 14" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block' }}>
    <rect width="10" height="14" rx="1.5" fill="#EF4444" />
  </svg>
);

// ── TeamFlag ────────────────────────────────────────────
// alt 속성은 i18n 팀명을 사용하지 않고 원본 team.name을 그대로 사용해도 무방하지만,
// 일관성을 위해 team.name (data.js의 한국어 원본) 또는 team.id를 alt로 사용.
// 사용자에게 보이지 않으므로 별도 useTeamName 훅을 사용하지 않음.
export function TeamFlag({ team, size = 'sm' }) {
  const imgClass = size === 'sm' ? 'w-5 h-3.5' : 'w-7 h-5';
  const altText = team.name ?? team.id ?? '';
  return team.flagImg
    ? <img src={`${BASE_URL}${team.flagImg}`} alt={altText} className={`${imgClass} object-cover rounded-sm shrink-0`} />
    : <span className="text-base leading-none">{team.flag}</span>;
}
