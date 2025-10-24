import api from '../utils/axios';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// 타입 정의
export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: string;
  profileImage?: string;
  provider?: string;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  name: string;
  phone: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

// 인증 서비스
export const authService = {
  /**
   * 회원가입
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post('/api/auth/register', data);
    return response.data;
  },

  /**
   * 로그인
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post('/api/auth/login', data);
    return response.data;
  },

  /**
   * 카카오 로그인 URL 가져오기
   */
  getKakaoLoginUrl: (): string => {
    return `${API_URL}/api/auth/kakao`;
  },

  /**
   * 구글 로그인 URL 가져오기 (선택사항)
   */
  getGoogleLoginUrl: (): string => {
    return `${API_URL}/api/auth/google`;
  },

  /**
   * Access Token 갱신
   */
  refreshToken: async (): Promise<{ accessToken: string }> => {
    const response = await axios.post(
      `${API_URL}/api/auth/refresh`,
      {},
      { withCredentials: true }
    );
    return response.data;
  },

  /**
   * 로그아웃
   */
  logout: async (): Promise<void> => {
    await api.post('/api/auth/logout');
  },

  /**
   * 현재 사용자 정보 조회
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },

  /**
   * 비밀번호 변경 (선택사항)
   */
  changePassword: async (oldPassword: string, newPassword: string): Promise<void> => {
    await api.post('/api/auth/change-password', {
      oldPassword,
      newPassword,
    });
  },

  /**
   * 비밀번호 재설정 요청 (선택사항)
   */
  requestPasswordReset: async (email: string): Promise<void> => {
    await api.post('/api/auth/request-password-reset', { email });
  },
};
