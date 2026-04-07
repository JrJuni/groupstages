import { useTranslation } from 'react-i18next';

/**
 * 팀 객체 또는 ID로 현재 언어의 팀명을 반환.
 * 키 누락 시 team.name (data.js의 한국어 원본) 또는 ID로 폴백.
 *
 * 사용:
 *   const teamName = useTeamName();
 *   <span>{teamName(team)}</span>
 *
 * 컴포넌트가 t() 호출 한 번만 하는 상황이면 직접:
 *   const { t } = useTranslation('teams');
 *   t(team.id, team.name)  // 두 번째 인자는 fallback
 */
export function useTeamName() {
  const { t } = useTranslation('teams');
  return (team) => {
    if (!team) return '';
    if (typeof team === 'string') return t(team, team);
    return t(team.id, team.name ?? team.id);
  };
}
