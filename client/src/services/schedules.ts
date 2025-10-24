import api from '../utils/axios';

export interface Schedule {
  id: string;
  storeId: string;
  date: string;
  startTime: string;
  endTime: string;
  requiredCount: number;
  hourlyWage: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
  store?: {
    id: string;
    name: string;
  };
  applications?: Application[];
  approvedCount?: number;
  isAvailable?: boolean;
  remainingSlots?: number;
}

export interface Application {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateScheduleRequest {
  storeId: string;
  date: string;
  startTime: string;
  endTime: string;
  requiredCount: number;
  hourlyWage: number;
  description?: string;
}

interface RequestOptions {
  skipAuth?: boolean;
}

export const scheduleService = {
  /**
   * 일정 목록 조회
   */
  getSchedules: async (params?: {
    storeId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    includeClosed?: boolean;
  }, options?: RequestOptions): Promise<Schedule[]> => {
    const response = await api.get('/api/schedules', {
      params,
      headers: options?.skipAuth ? { 'x-skip-auth': 'true' } : undefined,
    });
    return response.data;
  },

  /**
   * 일정 상세 조회
   */
  getSchedule: async (id: string, options?: RequestOptions): Promise<Schedule> => {
    const response = await api.get(`/api/schedules/${id}`, {
      headers: options?.skipAuth ? { 'x-skip-auth': 'true' } : undefined,
    });
    return response.data;
  },

  /**
   * 일정 생성
   */
  createSchedule: async (data: CreateScheduleRequest): Promise<Schedule> => {
    const response = await api.post('/api/schedules', data);
    return response.data;
  },

  /**
   * 일정 수정
   */
  updateSchedule: async (id: string, data: Partial<CreateScheduleRequest>): Promise<Schedule> => {
    const response = await api.put(`/api/schedules/${id}`, data);
    return response.data;
  },

  /**
   * 일정 삭제
   */
  deleteSchedule: async (id: string): Promise<void> => {
    await api.delete(`/api/schedules/${id}`);
  },
};

export const publicScheduleService = {
  getSchedules: async (params?: {
    storeId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    includeClosed?: boolean;
  }): Promise<Schedule[]> => {
    const response = await api.get('/api/public/schedules', { params });
    return response.data;
  },

  getSchedule: async (id: string): Promise<Schedule> => {
    const response = await api.get(`/api/public/schedules/${id}`);
    return response.data;
  },
};
