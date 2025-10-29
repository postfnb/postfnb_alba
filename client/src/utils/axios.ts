import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Vite 환경 변수 타입 정의
declare global {
  interface ImportMeta {
    env: {
      VITE_API_URL?: string;
    };
  }
}

const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000';

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // 쿠키 전송 활성화 (Refresh Token용)
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: Access Token 자동 추가
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const skipAuth = config.headers?.['x-skip-auth'] === 'true';
    const token = localStorage.getItem('accessToken');

    if (!skipAuth && token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 토큰 만료 시 자동 갱신
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 401 에러이고 재시도하지 않은 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.headers?.['x-skip-auth'] === 'true') {
        return Promise.reject(error);
      }
      originalRequest._retry = true;

      try {
        // Refresh Token으로 새로운 Access Token 요청
        const response = await axios.post(
          `${API_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);

        // 원래 요청에 새 토큰 적용
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        // 원래 요청 재시도
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh Token도 만료된 경우 로그아웃 처리
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
