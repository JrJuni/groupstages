// API URL 설정
// 개발: Vite proxy를 통해 localhost:3001로 연결
// 프로덕션: Workers API URL 사용
export const API_URL = import.meta.env.VITE_API_URL || '';
export const API_BASE = API_URL ? API_URL : '/api';

// Base URL (Vite base path 반영)
// 개발: /
// 프로덕션: /wc2026/
export const BASE_URL = import.meta.env.BASE_URL;
