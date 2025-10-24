import api from '../utils/axios';

export interface ApplicationDetail {
  id: string;
  scheduleId: string;
  userId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  message?: string;
  rejectReason?: string;
  processedBy?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
  schedule: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    hourlyWage: number;
    description?: string;
    store: {
      id: string;
      name: string;
    };
  };
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
}

export interface CreateApplicationRequest {
  scheduleId: string;
  message?: string;
}

export const applicationService = {
  /**
   * 신청 목록 조회
   */
  getApplications: async (params?: {
    scheduleId?: string;
    status?: string;
  }): Promise<ApplicationDetail[]> => {
    const response = await api.get('/api/applications', { params });
    return response.data;
  },

  /**
   * 신청 상세 조회
   */
  getApplication: async (id: string): Promise<ApplicationDetail> => {
    const response = await api.get(`/api/applications/${id}`);
    return response.data;
  },

  /**
   * 알바 신청
   */
  createApplication: async (data: CreateApplicationRequest): Promise<ApplicationDetail> => {
    const response = await api.post('/api/applications', data);
    return response.data;
  },

  /**
   * 신청 승인
   */
  approveApplication: async (id: string): Promise<ApplicationDetail> => {
    const response = await api.put(`/api/applications/${id}/approve`);
    return response.data;
  },

  /**
   * 신청 거부
   */
  rejectApplication: async (id: string, rejectReason?: string): Promise<ApplicationDetail> => {
    const response = await api.put(`/api/applications/${id}/reject`, { rejectReason });
    return response.data;
  },

  /**
   * 신청 취소
   */
  cancelApplication: async (id: string): Promise<void> => {
    await api.delete(`/api/applications/${id}`);
  },
};
