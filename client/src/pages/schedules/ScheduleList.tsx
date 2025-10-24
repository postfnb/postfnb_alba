import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { scheduleService, Schedule } from '../../services/schedules';
import { storeService, Store } from '../../services/stores';
import { useAuthStore } from '../../store/authStore';
import ScheduleCalendarWidget from '../../components/ScheduleCalendarWidget';
import { applicationService } from '../../services/applications';

const ScheduleList: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedStore, setSelectedStore] = useState('');
  const [formData, setFormData] = useState({
    storeId: '',
    date: '',
    startTime: '09:00',
    endTime: '18:00',
    requiredCount: 1,
    hourlyWage: 10000,
    description: '',
  });

  const [bulkMode, setBulkMode] = useState(false);
  const [bulkFormData, setBulkFormData] = useState({
    storeId: '',
    startDate: '',
    endDate: '',
    startTime: '09:00',
    endTime: '18:00',
    requiredCount: 1,
    hourlyWage: 10000,
    description: '',
    daysOfWeek: [] as number[], // 0=일요일, 1=월요일, ..., 6=토요일
  });

  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    loadData();
  }, [selectedStore]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [schedulesData, storesData] = await Promise.all([
        scheduleService.getSchedules(selectedStore ? { storeId: selectedStore } : {}),
        storeService.getStores(),
      ]);
      setSchedules(schedulesData);
      setStores(storesData);
    } catch (err: any) {
      setError(err.response?.data?.message || '데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await scheduleService.createSchedule(formData);
      setShowCreateModal(false);
      setFormData({
        storeId: '',
        date: '',
        startTime: '09:00',
        endTime: '18:00',
        requiredCount: 1,
        hourlyWage: 10000,
        description: '',
      });
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || '일정 생성에 실패했습니다.');
    }
  };

  const handleBulkCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const startDate = new Date(bulkFormData.startDate);
      const endDate = new Date(bulkFormData.endDate);
      
      const schedules = [];
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();
        
        // 선택된 요일인 경우에만 일정 생성
        if (bulkFormData.daysOfWeek.length === 0 || bulkFormData.daysOfWeek.includes(dayOfWeek)) {
          schedules.push({
            storeId: bulkFormData.storeId,
            date: currentDate.toISOString().split('T')[0],
            startTime: bulkFormData.startTime,
            endTime: bulkFormData.endTime,
            requiredCount: bulkFormData.requiredCount,
            hourlyWage: bulkFormData.hourlyWage,
            description: bulkFormData.description,
          });
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // 모든 일정 생성
      await Promise.all(schedules.map(schedule => scheduleService.createSchedule(schedule)));
      
      alert(`${schedules.length}개의 일정이 생성되었습니다.`);
      setShowCreateModal(false);
      setBulkMode(false);
      setBulkFormData({
        storeId: '',
        startDate: '',
        endDate: '',
        startTime: '09:00',
        endTime: '18:00',
        requiredCount: 1,
        hourlyWage: 10000,
        description: '',
        daysOfWeek: [],
      });
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || '일정 생성에 실패했습니다.');
    }
  };

  const toggleDayOfWeek = (day: number) => {
    setBulkFormData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day],
    }));
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('이 일정을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await scheduleService.deleteSchedule(id);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || '일정 삭제에 실패했습니다.');
    }
  };

  const getStatusBadge = (schedule: Schedule) => {
    const approved = schedule.approvedCount || 0;
    const required = schedule.requiredCount;
    
    if (approved >= required) {
      return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">마감</span>;
    } else if (approved > 0) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">진행중</span>;
    } else {
      return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">모집중</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="material-icons text-indigo-600 text-6xl animate-spin">refresh</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 네비게이션 */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <span className="material-icons">arrow_back</span>
              </button>
              <span className="material-icons text-indigo-600">calendar_month</span>
              <span className="text-xl font-bold text-gray-900">일정 관리</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{user?.name}</span>
              <button
                onClick={logout}
                className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
              >
                <span className="material-icons mr-1 text-sm">logout</span>
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 캘린더 */}
        <ScheduleCalendarWidget
          schedules={schedules}
          title="전체 일정 달력"
          subtitle="필터 조건에 맞는 근무 일정을 한눈에 확인하세요"
          onApproveApplication={async (applicationId) => {
            try {
              await applicationService.approveApplication(applicationId);
              await loadData();
            } catch (err: any) {
              alert(err.response?.data?.message || '신청 승인에 실패했습니다.');
            }
          }}
          onRejectApplication={async (applicationId) => {
            try {
              await applicationService.rejectApplication(applicationId);
              await loadData();
            } catch (err: any) {
              alert(err.response?.data?.message || '신청 거부에 실패했습니다.');
            }
          }}
          currentUserId={user?.id}
        />

        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">근무 일정</h1>
            <p className="text-gray-600 mt-1">총 {schedules.length}개의 일정</p>
          </div>
          {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <span className="material-icons mr-2">add</span>
              일정 추가
            </button>
          )}
        </div>

        {/* 필터 */}
        <div className="mb-6 flex space-x-4">
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">모든 업체</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {/* 일정 목록 */}
        <div className="space-y-4">
          {schedules.map((schedule) => (
            <div key={schedule.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">
                      {schedule.store?.name}
                    </h3>
                    {getStatusBadge(schedule)}
                  </div>
                  
                  <p className="text-gray-600 mb-4">{schedule.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center">
                      <span className="material-icons text-gray-400 text-sm mr-2">event</span>
                      <span>{new Date(schedule.date).toLocaleDateString('ko-KR')}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="material-icons text-gray-400 text-sm mr-2">schedule</span>
                      <span>{schedule.startTime} - {schedule.endTime}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="material-icons text-gray-400 text-sm mr-2">people</span>
                      <span>{schedule.approvedCount || 0}/{schedule.requiredCount}명</span>
                    </div>
                    <div className="flex items-center">
                      <span className="material-icons text-gray-400 text-sm mr-2">payments</span>
                      <span>{schedule.hourlyWage.toLocaleString()}원/시간</span>
                    </div>
                  </div>
                </div>

                {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                  <button
                    onClick={() => handleDelete(schedule.id)}
                    className="ml-4 text-red-600 hover:text-red-700"
                  >
                    <span className="material-icons">delete</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {schedules.length === 0 && !error && (
          <div className="text-center py-12">
            <span className="material-icons text-gray-400 text-6xl">calendar_month</span>
            <p className="mt-4 text-gray-600">등록된 일정이 없습니다.</p>
          </div>
        )}
      </main>

      {/* 일정 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">새 일정 추가</h2>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setBulkMode(false)}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    !bulkMode ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  단일 일정
                </button>
                <button
                  type="button"
                  onClick={() => setBulkMode(true)}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    bulkMode ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  기간별 일괄 등록
                </button>
              </div>
            </div>

            {!bulkMode ? (
              <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  업체 *
                </label>
                <select
                  required
                  value={formData.storeId}
                  onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">선택하세요</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  날짜 *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    시작 시간 *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    종료 시간 *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  필요 인원 *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.requiredCount}
                  onChange={(e) => setFormData({ ...formData, requiredCount: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  시급 (원) *
                </label>
                <input
                  type="number"
                  required
                  min="9860"
                  value={formData.hourlyWage}
                  onChange={(e) => setFormData({ ...formData, hourlyWage: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  업무 설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  placeholder="주방 보조, 홀 서빙 등..."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  추가
                </button>
              </div>
            </form>
            ) : (
              <form onSubmit={handleBulkCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    업체 *
                  </label>
                  <select
                    required
                    value={bulkFormData.storeId}
                    onChange={(e) => setBulkFormData({ ...bulkFormData, storeId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">선택하세요</option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      시작 날짜 *
                    </label>
                    <input
                      type="date"
                      required
                      value={bulkFormData.startDate}
                      onChange={(e) => setBulkFormData({ ...bulkFormData, startDate: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      종료 날짜 *
                    </label>
                    <input
                      type="date"
                      required
                      value={bulkFormData.endDate}
                      onChange={(e) => setBulkFormData({ ...bulkFormData, endDate: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    요일 선택 (선택 안하면 모든 요일)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => toggleDayOfWeek(index)}
                        className={`px-4 py-2 rounded-lg border ${
                          bulkFormData.daysOfWeek.includes(index)
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      시작 시간 *
                    </label>
                    <input
                      type="time"
                      required
                      value={bulkFormData.startTime}
                      onChange={(e) => setBulkFormData({ ...bulkFormData, startTime: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      종료 시간 *
                    </label>
                    <input
                      type="time"
                      required
                      value={bulkFormData.endTime}
                      onChange={(e) => setBulkFormData({ ...bulkFormData, endTime: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    필요 인원 *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={bulkFormData.requiredCount}
                    onChange={(e) => setBulkFormData({ ...bulkFormData, requiredCount: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    시급 (원) *
                  </label>
                  <input
                    type="number"
                    required
                    min="9860"
                    value={bulkFormData.hourlyWage}
                    onChange={(e) => setBulkFormData({ ...bulkFormData, hourlyWage: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    업무 설명
                  </label>
                  <textarea
                    value={bulkFormData.description}
                    onChange={(e) => setBulkFormData({ ...bulkFormData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    rows={3}
                    placeholder="주방 보조, 홀 서빙 등..."
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    💡 선택한 기간 동안 {bulkFormData.daysOfWeek.length === 0 ? '매일' : '선택한 요일에'} 동일한 시간대의 일정이 생성됩니다.
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setBulkMode(false);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    일괄 생성
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleList;
