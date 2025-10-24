import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { scheduleService, Schedule } from '../../services/schedules';
import { storeService, Store } from '../../services/stores';
import { applicationService } from '../../services/applications';
import { useAuthStore } from '../../store/authStore';

const statusBadgeClass = (status: string) => {
  const map: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-gray-100 text-gray-700',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
};

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    PENDING: '대기중',
    APPROVED: '승인됨',
    REJECTED: '거부됨',
    CANCELLED: '취소됨',
  };
  return map[status] || status;
};

const getStatusCount = (schedule: Schedule, status: string) => {
  if (!schedule.applications) return 0;
  return schedule.applications.filter(app => app.status === status).length;
};

const ApplicationList: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [viewMode, setViewMode] = useState<'current' | 'next'>('current');
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  useEffect(() => {
    loadData();
  }, [selectedStore, viewMode]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // 현재 달과 다음 달의 시작/종료일 계산
      const startDate = new Date().setDate(1);
      const endDate = new Date(new Date().getFullYear(), new Date().getMonth() + (viewMode === 'next' ? 2 : 1), 0);

      const [schedulesData, storesData] = await Promise.all([
        scheduleService.getSchedules({
          storeId: selectedStore || undefined,
          startDate: new Date(startDate).toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        }),
        storeService.getStores(),
      ]);

      console.log('=== 신청 관리 달력 데이터 로드 ===');
      console.log('조회 기간:', new Date(startDate).toISOString().split('T')[0], '~', endDate.toISOString().split('T')[0]);
      console.log('전체 일정 수:', schedulesData.length);
      schedulesData.forEach(s => {
        const pendingCount = s.applications?.filter(app => app.status === 'PENDING').length || 0;
        const approvedCount = s.applications?.filter(app => app.status === 'APPROVED').length || 0;
        console.log(`- ${s.date}: ${s.store?.name}, 대기: ${pendingCount}, 승인: ${approvedCount}`);
      });
      console.log('================================');

      setSchedules(schedulesData);
      setStores(storesData);
    } catch (err: any) {
      console.error('데이터 로드 오류:', err);
      setError(err.response?.data?.message || '데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };



  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    
    if (!window.confirm(`선택한 ${selectedIds.length}개의 신청을 승인하시겠습니까?`)) {
      return;
    }

    try {
      await Promise.all(selectedIds.map(id => applicationService.approveApplication(id)));
      alert(`${selectedIds.length}개의 신청이 승인되었습니다.`);
      setSelectedIds([]);
      setIsBulkMode(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || '일괄 승인에 실패했습니다.');
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.length === 0) return;
    
    if (!window.confirm(`선택한 ${selectedIds.length}개의 신청을 거부하시겠습니까?`)) {
      return;
    }

    try {
      await Promise.all(selectedIds.map(id => applicationService.rejectApplication(id, '일괄 거부')));
      alert(`${selectedIds.length}개의 신청이 거부되었습니다.`);
      setSelectedIds([]);
      setIsBulkMode(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || '일괄 거부에 실패했습니다.');
    }
  };


  const selectAll = () => {
    const pendingIds = schedules
      .flatMap(s => s.applications || [])
      .filter(app => app.status === 'PENDING')
      .map(app => app.id);
    setSelectedIds(pendingIds);
  };

  const deselectAll = () => {
    setSelectedIds([]);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const getSchedulesForDate = (date: Date | null) => {
    if (!date) return [];
    return schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.date);
      return scheduleDate.getDate() === date.getDate() &&
        scheduleDate.getMonth() === date.getMonth() &&
        scheduleDate.getFullYear() === date.getFullYear();
    });
  };

  const getApprovedCountValue = (schedule: Schedule) => {
    if (!schedule.applications) return 0;
    return schedule.applications.filter(app => app.status === 'APPROVED').length;
  };

  const handleScheduleClick = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setShowDetailModal(true);
  };

  const closeModal = () => {
    setShowDetailModal(false);
    setSelectedSchedule(null);
  };

  const handleApproveApplication = async (id: string) => {
    if (!window.confirm('이 신청을 승인하시겠습니까?')) {
      return;
    }

    try {
      setActionLoading(true);
      await applicationService.approveApplication(id);
      await loadData();
      if (selectedSchedule) {
        const updatedSchedules = await scheduleService.getSchedules();
        const updated = updatedSchedules.find(s => s.id === selectedSchedule.id);
        if (updated) {
          setSelectedSchedule(updated);
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || '승인에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectApplication = async (id: string) => {
    const reason = prompt('거부 사유를 입력하세요:');
    if (!reason) return;

    try {
      setActionLoading(true);
      await applicationService.rejectApplication(id, reason);
      await loadData();
      if (selectedSchedule) {
        const updatedSchedules = await scheduleService.getSchedules();
        const updated = updatedSchedules.find(s => s.id === selectedSchedule.id);
        if (updated) {
          setSelectedSchedule(updated);
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || '거부에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const generateCalendar = (month: Date) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const calendar: (Date | null)[][] = [];
    let week: (Date | null)[] = [];

    // 첫 주의 빈 칸 채우기
    for (let i = 0; i < startingDayOfWeek; i++) {
      week.push(null);
    }

    // 날짜 채우기
    for (let day = 1; day <= daysInMonth; day++) {
      week.push(new Date(year, monthIndex, day));
      if (week.length === 7) {
        calendar.push(week);
        week = [];
      }
    }

    // 마지막 주의 빈 칸 채우기
    if (week.length > 0) {
      while (week.length < 7) {
        week.push(null);
      }
      calendar.push(week);
    }

    return calendar;
  };

  const currentCalendar = generateCalendar(new Date());


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
              <span className="material-icons text-indigo-600">assignment</span>
              <span className="text-xl font-bold text-gray-900">신청 관리 달력</span>
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">신청 내역 달력</h1>
            <p className="text-gray-600 mt-1">모든 신청을 달력으로 확인하고 승인 또는 거부할 수 있습니다.</p>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('current')}
              className={`px-4 py-2 rounded-lg ${
                viewMode === 'current'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              이번 달
            </button>
            <button
              onClick={() => setViewMode('next')}
              className={`px-4 py-2 rounded-lg ${
                viewMode === 'next'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              다음 달까지
            </button>
          </div>
        </div>

        {/* 필터 및 일괄 작업 */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex space-x-4 items-center">
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

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">모든 상태</option>
              <option value="PENDING">대기중</option>
              <option value="APPROVED">승인됨</option>
              <option value="REJECTED">거부됨</option>
              <option value="CANCELLED">취소됨</option>
            </select>

            {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
              <button
                onClick={() => {
                  setIsBulkMode(!isBulkMode);
                  setSelectedIds([]);
                }}
                className={`px-4 py-2 rounded-lg border ${
                  isBulkMode
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="material-icons text-sm mr-1">checklist</span>
                일괄 선택 모드
              </button>
            )}
          </div>

          {isBulkMode && selectedIds.length > 0 && (
            <div className="flex space-x-2">
              <button
                onClick={handleBulkApprove}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <span className="material-icons text-sm mr-1">check</span>
                {selectedIds.length}개 승인
              </button>
              <button
                onClick={handleBulkReject}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <span className="material-icons text-sm mr-1">close</span>
                {selectedIds.length}개 거부
              </button>
            </div>
          )}
        </div>

        {/* 전체 선택/해제 */}
        {isBulkMode && schedules.some(s => s.applications?.some(app => app.status === 'PENDING')) && (
          <div className="mb-4 flex space-x-4">
            <button
              onClick={selectAll}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              대기중인 신청 전체 선택
            </button>
            <button
              onClick={deselectAll}
              className="text-sm text-gray-600 hover:text-gray-700"
            >
              선택 해제
            </button>
          </div>
        )}

        {/* 범례 */}
        <div className="mb-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-50 border border-green-200 rounded mr-2"></div>
            <span>승인된 일정 있음</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-50 border border-yellow-200 rounded mr-2"></div>
            <span>대기 중인 일정</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-50 border border-red-200 rounded mr-2"></div>
            <span>거부된 일정 있음</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-50 border border-blue-300 rounded mr-2"></div>
            <span>오늘</span>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center">
              <button
                onClick={() => {
                  setViewMode('current');
                }}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                이전 달
              </button>
              <h2 className="text-lg font-bold text-gray-900">
                {new Date().getFullYear()}년 {new Date().getMonth() + 1}월
              </h2>
              <button
                onClick={() => {
                  setViewMode('current');
                }}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                다음 달
              </button>
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                <div
                  key={day}
                  className={`text-center font-semibold py-2 ${
                    index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="space-y-2">
              {currentCalendar.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 gap-2">
                  {week.map((date, dayIndex) => {
                    const daySchedules = getSchedulesForDate(date);
                    const hasApproved = daySchedules.some(s => getStatusCount(s, 'APPROVED') > 0);
                    const hasPending = daySchedules.some(s => getStatusCount(s, 'PENDING') > 0);
                    const hasRejected = daySchedules.some(s => getStatusCount(s, 'REJECTED') > 0);
                    let bgClass = 'bg-white border-gray-200';
                    if (!date) {
                      bgClass = 'bg-gray-50 border-gray-200';
                    } else if (isToday(date)) {
                      bgClass = 'bg-blue-50 border-blue-300';
                    } else if (hasApproved) {
                      bgClass = 'bg-green-50 border-green-200';
                    } else if (hasPending) {
                      bgClass = 'bg-yellow-50 border-yellow-200';
                    } else if (hasRejected) {
                      bgClass = 'bg-red-50 border-red-200';
                    }

                    return (
                      <div
                        key={dayIndex}
                        className={`min-h-[100px] p-2 border rounded-lg ${bgClass} ${date ? 'hover:shadow-md transition' : ''}`}
                      >
                        {date && (
                          <>
                            <div
                              className={`text-sm font-semibold mb-1 ${
                                dayIndex === 0 ? 'text-red-600' : dayIndex === 6 ? 'text-blue-600' : 'text-gray-700'
                              }`}
                            >
                              {date.getDate()}
                            </div>
                            <div className="space-y-1">
                              {daySchedules.map((schedule) => {
                                const applications = schedule.applications || [];
                                const pendingCount = getStatusCount(schedule, 'PENDING');
                                const approvedCount = getApprovedCountValue(schedule);
                                const rejectedCount = getStatusCount(schedule, 'REJECTED');

                                const borderClass = approvedCount > 0 ? 'border-green-300' : pendingCount > 0 ? 'border-yellow-300' : 'border-gray-200';

                                return (
                                  <div
                                    key={schedule.id}
                                    onClick={() => handleScheduleClick(schedule)}
                                    className={`text-xs p-1 bg-white rounded border ${borderClass} cursor-pointer hover:bg-gray-50 transition`}
                                  >
                                    <div className="font-medium text-gray-900 truncate">
                                      {schedule.store?.name}
                                    </div>
                                    <div className="text-gray-600">
                                      {schedule.startTime.slice(0, 5)} - {schedule.endTime.slice(0, 5)}
                                    </div>
                                    <div className="font-semibold flex items-center text-green-600">
                                      <span className="material-icons text-xs mr-1">check_circle</span>
                                      승인: {approvedCount}/{schedule.requiredCount}
                                    </div>
                                    <div className="font-semibold flex items-center text-yellow-600">
                                      <span className="material-icons text-xs mr-1">hourglass_empty</span>
                                      대기: {pendingCount}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {schedules.length === 0 && !error && (
          <div className="text-center py-12">
            <span className="material-icons text-gray-400 text-6xl">assignment</span>
            <p className="mt-4 text-gray-600">신청 내역이 없습니다.</p>
          </div>
        )}
      </main>

      {showDetailModal && selectedSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900">일정 신청 상세</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <span className="material-icons">close</span>
              </button>
            </div>

            <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
              <h3 className="text-lg font-bold text-indigo-900 mb-2">{selectedSchedule.store?.name}</h3>
              {selectedSchedule.description && <p className="text-gray-700">{selectedSchedule.description}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center mb-2">
                  <span className="material-icons text-gray-600 mr-2">event</span>
                  <span className="text-sm text-gray-600">날짜</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(selectedSchedule.date).toLocaleDateString('ko-KR', {
                    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
                  })}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center mb-2">
                  <span className="material-icons text-gray-600 mr-2">schedule</span>
                  <span className="text-sm text-gray-600">근무 시간</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedSchedule.startTime.slice(0, 5)} - {selectedSchedule.endTime.slice(0, 5)}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center mb-2">
                  <span className="material-icons text-gray-600 mr-2">people</span>
                  <span className="text-sm text-gray-600">모집 현황</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  모집 {selectedSchedule.requiredCount}명 · 확정 {getApprovedCountValue(selectedSchedule)}명 · 대기 {getStatusCount(selectedSchedule, 'PENDING')}명
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center mb-2">
                  <span className="material-icons text-gray-600 mr-2">payments</span>
                  <span className="text-sm text-gray-600">시급</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">{selectedSchedule.hourlyWage.toLocaleString()}원</p>
              </div>
            </div>

            {selectedSchedule.applications && selectedSchedule.applications.filter(app => app.status === 'PENDING').length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                  <span className="material-icons mr-2 text-yellow-600">hourglass_empty</span>
                  대기 중인 신청
                </h3>
                <div className="space-y-2">
                  {selectedSchedule.applications.filter(app => app.status === 'PENDING').map((app) => (
                    <div key={app.id} className="flex flex-col md:flex-row md:items-center md:justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg gap-3">
                      <div className="flex items-center">
                        <span className="material-icons text-yellow-600 mr-3">person</span>
                        <div>
                          <p className="font-semibold text-gray-900">{app.user.name}</p>
                          <p className="text-sm text-gray-600">{app.user.email}</p>
                        </div>
                      </div>
                      {isManager && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApproveApplication(app.id)}
                            disabled={actionLoading}
                            className={`px-4 py-2 rounded-lg text-white ${actionLoading ? 'bg-green-300' : 'bg-green-600 hover:bg-green-700'}`}
                          >
                            승인
                          </button>
                          <button
                            onClick={() => handleRejectApplication(app.id)}
                            disabled={actionLoading}
                            className={`px-4 py-2 rounded-lg text-white ${actionLoading ? 'bg-red-300' : 'bg-red-600 hover:bg-red-700'}`}
                          >
                            거부
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedSchedule.applications && selectedSchedule.applications.filter(app => app.status === 'APPROVED').length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                  <span className="material-icons mr-2 text-green-600">check_circle</span>
                  승인된 신청
                </h3>
                <div className="space-y-2">
                  {selectedSchedule.applications.filter(app => app.status === 'APPROVED').map((app) => (
                    <div key={app.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center">
                        <span className="material-icons text-green-600 mr-3">person</span>
                        <div>
                          <p className="font-semibold text-gray-900">{app.user.name}</p>
                          <p className="text-sm text-gray-600">{app.user.email}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">승인됨</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedSchedule.applications && selectedSchedule.applications.filter(app => app.status === 'REJECTED').length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                  <span className="material-icons mr-2 text-red-600">cancel</span>
                  거부된 신청
                </h3>
                <div className="space-y-2">
                  {selectedSchedule.applications.filter(app => app.status === 'REJECTED').map((app) => (
                    <div key={app.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <span className="material-icons text-red-600 mr-3">person</span>
                          <div>
                            <p className="font-semibold text-gray-900">{app.user.name}</p>
                            <p className="text-sm text-gray-600">{app.user.email}</p>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">거부됨</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(!selectedSchedule.applications || selectedSchedule.applications.length === 0) && (
              <div className="text-center py-8">
                <span className="material-icons text-gray-400 text-5xl">person_off</span>
                <p className="mt-3 text-gray-600">아직 신청한 직원이 없습니다.</p>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button onClick={closeModal} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationList;
