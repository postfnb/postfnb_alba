import { create } from 'zustand';
import { authService, User } from '../services/auth';

interface AuthStore {
  // 상태
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // 액션
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, phone: string) => Promise<void>;
  logout: () => Promise<void>;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  loadUser: () => Promise<void>;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  // 초기 상태
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isLoading: false,
  error: null,

  /**
   * 로그인
   */
  login: async (email: string, password: string) => {
    try {
      console.log('[AuthStore] 로그인 시작');
      set({ error: null, isLoading: true });
      
      const { accessToken, user } = await authService.login({ email, password });
      console.log('[AuthStore] 로그인 응답 받음:', { user, hasToken: !!accessToken });
      
      localStorage.setItem('accessToken', accessToken);
      set({ 
        accessToken, 
        user, 
        isAuthenticated: true, 
        isLoading: false,
        error: null 
      });
      console.log('[AuthStore] 인증 상태 업데이트 완료:', { isAuthenticated: true });
    } catch (error: any) {
      console.error('[AuthStore] 로그인 에러:', error);
      const errorMessage = error.response?.data?.message || '로그인에 실패했습니다.';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * 회원가입
   */
  register: async (email: string, password: string, name: string, phone: string) => {
    try {
      set({ error: null, isLoading: true });
      
      const { accessToken, user } = await authService.register({ 
        email, 
        password, 
        name,
        phone
      });
      
      localStorage.setItem('accessToken', accessToken);
      set({ 
        accessToken, 
        user, 
        isAuthenticated: true, 
        isLoading: false,
        error: null 
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '회원가입에 실패했습니다.';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * 로그아웃
   */
  logout: async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('로그아웃 오류:', error);
    } finally {
      localStorage.removeItem('accessToken');
      set({ 
        user: null, 
        accessToken: null, 
        isAuthenticated: false,
        error: null 
      });
    }
  },

  /**
   * 인증 정보 설정 (소셜 로그인 콜백용)
   */
  setAuth: (token: string, user: User) => {
    localStorage.setItem('accessToken', token);
    set({ 
      accessToken: token, 
      user, 
      isAuthenticated: true,
      error: null 
    });
  },

  /**
   * 인증 정보 초기화
   */
  clearAuth: () => {
    localStorage.removeItem('accessToken');
    set({ 
      user: null, 
      accessToken: null, 
      isAuthenticated: false,
      error: null 
    });
  },

  /**
   * 사용자 정보 로드 (앱 시작 시 실행)
   */
  loadUser: async () => {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      console.log('[AuthStore] 토큰 없음, 로드 중단');
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      console.log('[AuthStore] 사용자 정보 로드 시작');
      const user = await authService.getCurrentUser();
      console.log('[AuthStore] 사용자 정보 로드 성공:', user);
      set({ 
        user, 
        isAuthenticated: true, 
        isLoading: false,
        error: null 
      });
    } catch (error) {
      console.error('[AuthStore] 사용자 정보 로드 실패, 토큰 제거:', error);
      // 토큰이 유효하지 않으면 제거
      localStorage.removeItem('accessToken');
      set({ 
        user: null, 
        accessToken: null, 
        isAuthenticated: false, 
        isLoading: false,
        error: null 
      });
    }
  },

  /**
   * 에러 메시지 설정
   */
  setError: (error: string | null) => {
    set({ error });
  },
}));
