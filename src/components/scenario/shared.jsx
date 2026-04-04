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

export const WDL_KO = { W: '승', D: '무', L: '패' };

// ── 날짜 포맷 ───────────────────────────────────────────
const kstFormatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  month: 'numeric',
  day: 'numeric',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function formatKST(iso) {
  if (!iso) return null;
  return kstFormatter.format(new Date(iso)) + ' KST';
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
export function TeamFlag({ team, size = 'sm' }) {
  const imgClass = size === 'sm' ? 'w-5 h-3.5' : 'w-7 h-5';
  return team.flagImg
    ? <img src={`${BASE_URL}${team.flagImg}`} alt={team.name} className={`${imgClass} object-cover rounded-sm shrink-0`} />
    : <span className="text-base leading-none">{team.flag}</span>;
}
