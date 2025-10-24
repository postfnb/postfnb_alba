import api from '../utils/axios';

export interface Store {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  description?: string;
  baseHourlyWage: number;
  createdAt: string;
  updatedAt: string;
  managers?: {
    user: {
      id: string;
      name: string;
      email: string;
    };
  }[];
  _count?: {
    schedules: number;
  };
}

export interface CreateStoreRequest {
  name: string;
  address?: string;
  phone?: string;
  description?: string;
  baseHourlyWage?: number;
}

export const storeService = {
  /**
   * 업체 목록 조회
   */
  getStores: async (): Promise<Store[]> => {
    const response = await api.get('/api/stores');
    return response.data;
  },

  /**
   * 업체 상세 조회
   */
  getStore: async (id: string): Promise<Store> => {
    const response = await api.get(`/api/stores/${id}`);
    return response.data;
  },

  /**
   * 업체 생성
   */
  createStore: async (data: CreateStoreRequest): Promise<Store> => {
    const response = await api.post('/api/stores', data);
    return response.data;
  },

  /**
   * 업체 수정
   */
  updateStore: async (id: string, data: Partial<CreateStoreRequest>): Promise<Store> => {
    const response = await api.put(`/api/stores/${id}`, data);
    return response.data;
  },

  /**
   * 업체 삭제
   */
  deleteStore: async (id: string): Promise<void> => {
    await api.delete(`/api/stores/${id}`);
  },

  /**
   * 관리자 추가
   */
  addManager: async (storeId: string, userId: string): Promise<void> => {
    await api.post(`/api/stores/${storeId}/managers`, { userId });
  },

  /**
   * 관리자 제거
   */
  removeManager: async (storeId: string, userId: string): Promise<void> => {
    await api.delete(`/api/stores/${storeId}/managers/${userId}`);
  },
};
