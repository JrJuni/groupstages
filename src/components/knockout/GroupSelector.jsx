import React from 'react';
import { useTranslation } from 'react-i18next';

const GROUP_KEYS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

export default function GroupSelector({ selected, onSelect }) {
  const { t } = useTranslation('bracket');
  return (
    <div className="flex items-center gap-1 flex-wrap">
      <span className="text-xs text-fifa-muted mr-1">{t('groupSelector')}</span>
      {GROUP_KEYS.map((key) => (
        <button
          key={key}
          onClick={() => onSelect(selected === key ? null : key)}
          className={`w-7 h-7 rounded-lg text-xs font-bold transition-all
            ${selected === key
              ? 'bg-fifa-gold text-black shadow-lg shadow-fifa-gold/30'
              : 'bg-white/10 text-fifa-muted hover:text-white hover:bg-white/20'
            }`}
        >
          {key}
        </button>
      ))}
    </div>
  );
}
