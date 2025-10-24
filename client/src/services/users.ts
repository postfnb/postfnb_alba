import api from '../utils/axios';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  provider: 'LOCAL' | 'KAKAO' | 'GOOGLE';
  profileImage?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserDetail extends User {
  applications?: {
    id: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
    createdAt: string;
    schedule: {
      id: string;
      date: string;
      startTime: string;
      endTime: string;
      hourlyWage: number;
      store: {
        id: string;
        name: string;
      };
    };
  }[];
  _count?: {
    applications: number;
    managedStores: number;
  };
}

export const userService = {
  /**
   * 사용자 목록 조회
   */
  getUsers: async (params?: {
    role?: string;
    search?: string;
  }): Promise<User[]> => {
    const response = await api.get('/api/users', { params });
    return response.data;
  },

  /**
   * 사용자 상세 조회
   */
  getUser: async (id: string): Promise<UserDetail> => {
    const response = await api.get(`/api/users/${id}`);
    return response.data;
  },

  /**
   * 사용자 정보 수정
   */
  updateUser: async (id: string, data: { name?: string; phone?: string; role?: string }): Promise<User> => {
    const response = await api.put(`/api/users/${id}`, data);
    return response.data;
  },

  /**
   * 사용자 역할 변경
   */
  updateUserRole: async (id: string, role: string): Promise<User> => {
    const response = await api.put(`/api/users/${id}/role`, { role });
    return response.data;
  },

  /**
   * 사용자 로그인 차단
   */
  blockUser: async (id: string): Promise<{ message: string; user: User }> => {
    const response = await api.put(`/api/users/${id}/block`);
    return response.data;
  },

  /**
   * 사용자 로그인 차단 해제
   */
  unblockUser: async (id: string): Promise<{ message: string; user: User }> => {
    const response = await api.put(`/api/users/${id}/unblock`);
    return response.data;
  },

  /**
   * 사용자 패스워드 변경
   */
  changePassword: async (id: string, newPassword: string): Promise<{ message: string }> => {
    const response = await api.put(`/api/users/${id}/password`, { newPassword });
    return response.data;
  },

  /**
   * 사용자 삭제
   */
  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/api/users/${id}`);
  },
};
