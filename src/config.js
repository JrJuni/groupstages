// API URL 설정
// 개발: Vite proxy를 통해 localhost:3001로 연결
// 프로덕션: Railway 백엔드 URL 사용
export const API_URL = import.meta.env.VITE_API_URL || '';
export const API_BASE = API_URL ? API_URL : '/api';
