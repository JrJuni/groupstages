import { useState, useCallback } from 'react';

export const LS_KEYS = {
  ACTIVE_TAB: 'gs_activeTab',
  SCENARIO_GROUP: 'gs_scenarioGroup',
  SCENARIO_TEAM: 'gs_scenarioTeam',
};

export function useLocalStorage(key, defaultValue = null) {
  const [value, setValue] = useState(() => localStorage.getItem(key) ?? defaultValue);

  const set = useCallback((v) => {
    if (v === null || v === undefined) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, v);
    }
    setValue(v ?? defaultValue);
  }, [key, defaultValue]);

  const remove = useCallback(() => {
    localStorage.removeItem(key);
    setValue(defaultValue);
  }, [key, defaultValue]);

  return [value, set, remove];
}
