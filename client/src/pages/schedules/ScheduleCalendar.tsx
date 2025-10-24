import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { scheduleService, Schedule } from '../../services/schedules';
import { storeService, Store } from '../../services/stores';
import { applicationService } from '../../services/applications';
import { useAuthStore } from '../../store/authStore';

const ScheduleCalendar: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'current' | 'next'>('current');
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  useEffect(() => {
    loadData();
  }, [selectedStore, currentMonth, viewMode]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // 현재 달과 다음 달의 시작/종료일 계산
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + (viewMode === 'next' ? 2 : 1), 0);

      const [schedulesData, storesData] = await Promise.all([
        scheduleService.getSchedules({
          storeId: selectedStore || undefined,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        }),
        storeService.getStores(),
      ]);

      console.log('=== 달력 데이터 로드 ===');
      console.log('조회 기간:', startDate.toISOString().split('T')[0], '~', endDate.toISOString().split('T')[0]);
      console.log('전체 일정 수:', schedulesData.length);
      console.log('승인된 일정:', schedulesData.filter(s => (s.approvedCount || 0) > 0).length);
      schedulesData.forEach(s => {
        console.log(`- ${s.date}: ${s.store?.name}, 승인: ${s.approvedCount}/${s.requiredCount}`);
      });
      console.log('====================');

      setSchedules(schedulesData);
      setStores(storesData);
    } catch (err: any) {
      setError(err.response?.data?.message || '데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 달력 생성 함수
  const generateCalendar = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const calendar: (Date | null)[][] = [];
    let week: (Date | null)[] = [];

    // 첫 주의 빈 칸 채우기
    for (let i = 0; i < startDayOfWeek; i++) {
      week.push(null);
    }

    // 날짜 채우기
    for (let day = 1; day <= daysInMonth; day++) {
      week.push(new Date(year, month, day));
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

  // 특정 날짜의 일정 가져오기
  const getSchedulesForDate = (date: Date | null) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return schedules.filter(s => {
      // 서버에서 받은 날짜를 Date 객체로 변환 후 비교
      const scheduleDate = new Date(s.date);
      const scheduleDateStr = scheduleDate.toISOString().split('T')[0];
      return scheduleDateStr === dateStr;
    });
  };

  // 승인된 일정만 필터링
  const getApprovedSchedules = (daySchedules: Schedule[]) => {
    // approvedCount가 0보다 큰 일정만 반환
    const approved = daySchedules.filter(s => {
      const count = s.approvedCount || 0;
      console.log(`일정 ${s.id}: approvedCount=${count}, store=${s.store?.name}`);
      return count > 0;
    });
    return approved;
  };

  // 특정 일정의 승인된 인원 수 반환
  const getApprovedCount = (schedule: Schedule) => {
    return schedule.approvedCount || 0;
  };

  // 특정 일정의 대기 인원 수 반환
  const getPendingCount = (schedule: Schedule) => {
    if (!schedule.applications) return 0;
    return schedule.applications.filter(app => app.status === 'PENDING').length;
  };

  // 월 변경
  const changeMonth = (delta: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1));
  };

  // 오늘 날짜인지 확인
  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // 일정 상세보기
  const handleScheduleClick = (schedule: Schedule) => {
    console.log('일정 클릭됨:', schedule.id, schedule.store?.name);
    setSelectedSchedule(schedule);
    setShowDetailModal(true);
    console.log('모달 상태 변경 완료');
  };

  // 모달 닫기
  const closeModal = () => {
    setShowDetailModal(false);
    setSelectedSchedule(null);
  };

  const handleApproveApplication = async (id: string) => {
    if (!window.confirm('이 신청을 승인하시겠습니까?')) return;
    try {
      setActionLoading(true);
      await applicationService.approveApplication(id);
      await loadData();
      if (selectedSchedule) {
        const updated = (await scheduleService.getSchedules()).find(s => s.id === selectedSchedule.id);
        if (updated) setSelectedSchedule(updated);
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
        const updated = (await scheduleService.getSchedules()).find(s => s.id === selectedSchedule.id);
        if (updated) setSelectedSchedule(updated);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || '거부에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  // 현재 달력 생성
  const currentCalendar = generateCalendar(currentMonth.getFullYear(), currentMonth.getMonth());
  const nextCalendar = viewMode === 'next' 
    ? generateCalendar(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    : null;

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
              <span className="material-icons text-indigo-600">calendar_today</span>
              <span className="text-xl font-bold text-gray-900">근무 달력</span>
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
        {/* 헤더 */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">승인된 근무 일정</h1>
            <p className="text-gray-600 mt-1">월별 달력으로 확인하세요</p>
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

        {/* 필터 */}
        <div className="mb-6 flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
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

          <div className="flex items-center space-x-2">
            <button
              onClick={() => changeMonth(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <span className="material-icons">chevron_left</span>
            </button>
            <span className="text-lg font-semibold min-w-[120px] text-center">
              {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
            </span>
            <button
              onClick={() => changeMonth(1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <span className="material-icons">chevron_right</span>
            </button>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {/* 범례 */}
        <div className="mb-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded mr-2"></div>
            <span>승인된 일정 있음</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded mr-2"></div>
            <span>대기 중인 일정</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded mr-2"></div>
            <span>오늘</span>
          </div>
        </div>

        {/* 이번 달 달력 */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-4 border-b">
            <h2 className="text-lg font-bold text-gray-900">
              {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
            </h2>
          </div>
          <div className="p-4">
            {/* 요일 헤더 */}
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

            {/* 날짜 그리드 */}
            <div className="space-y-2">
              {currentCalendar.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 gap-2">
                  {week.map((date, dayIndex) => {
                    const daySchedules = getSchedulesForDate(date);
                    const approvedSchedules = getApprovedSchedules(daySchedules);
                    const pendingSchedules = daySchedules.filter(s => (s.approvedCount || 0) === 0);
                    const hasApproved = approvedSchedules.length > 0;
                    const hasPending = pendingSchedules.length > 0;

                    return (
                      <div
                        key={dayIndex}
                        className={`min-h-[100px] p-2 border rounded-lg ${
                          !date
                            ? 'bg-gray-50'
                            : isToday(date)
                            ? 'bg-blue-50 border-blue-300'
                            : hasApproved
                            ? 'bg-green-50 border-green-200'
                            : hasPending
                            ? 'bg-yellow-50 border-yellow-200'
                            : 'bg-white border-gray-200'
                        } ${date ? 'hover:shadow-md transition' : ''}`}
                      >
                        {date && (
                          <>
                            <div
                              className={`text-sm font-semibold mb-1 ${
                                dayIndex === 0
                                  ? 'text-red-600'
                                  : dayIndex === 6
                                  ? 'text-blue-600'
                                  : 'text-gray-700'
                              }`}
                            >
                              {date.getDate()}
                            </div>
                            <div className="space-y-1">
                              {/* 승인된 일정 */}
                              {approvedSchedules.map((schedule) => (
                                <div
                                  key={schedule.id}
                                  onClick={() => handleScheduleClick(schedule)}
                                  className="text-xs p-1 bg-white rounded border border-green-300 cursor-pointer hover:bg-green-50 transition"
                                >
                                  <div className="font-medium text-gray-900 truncate">
                                    {schedule.store?.name}
                                  </div>
                                  <div className="text-gray-600">
                                    {schedule.startTime.slice(0, 5)} - {schedule.endTime.slice(0, 5)}
                                  </div>
                                  <div className="text-green-600 font-semibold flex items-center">
                                    <span className="material-icons text-xs mr-1">check_circle</span>
                                    {schedule.approvedCount}/{schedule.requiredCount}명
                                    {getPendingCount(schedule) > 0 && (
                                      <span className="ml-2 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                                        대기 {getPendingCount(schedule)}명
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                              {/* 대기 중인 일정 */}
                              {pendingSchedules.map((schedule) => (
                                <div
                                  key={schedule.id}
                                  onClick={() => handleScheduleClick(schedule)}
                                  className="text-xs p-1 bg-white rounded border border-yellow-300 cursor-pointer hover:bg-yellow-50 transition"
                                >
                                  <div className="font-medium text-gray-900 truncate">
                                    {schedule.store?.name}
                                  </div>
                                  <div className="text-gray-600">
                                    {schedule.startTime.slice(0, 5)} - {schedule.endTime.slice(0, 5)}
                                  </div>
                                  <div className="text-yellow-600 font-semibold flex items-center">
                                    <span className="material-icons text-xs mr-1">schedule</span>
                                    0/{schedule.requiredCount}명
                                  </div>
                                </div>
                              ))}
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

        {/* 다음 달 달력 (viewMode가 'next'일 때만) */}
        {viewMode === 'next' && nextCalendar && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-lg font-bold text-gray-900">
                {currentMonth.getMonth() === 11
                  ? `${currentMonth.getFullYear() + 1}년 1월`
                  : `${currentMonth.getFullYear()}년 ${currentMonth.getMonth() + 2}월`}
              </h2>
            </div>
            <div className="p-4">
              {/* 요일 헤더 */}
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

              {/* 날짜 그리드 */}
              <div className="space-y-2">
                {nextCalendar.map((week, weekIndex) => (
                  <div key={weekIndex} className="grid grid-cols-7 gap-2">
                    {week.map((date, dayIndex) => {
                      const daySchedules = getSchedulesForDate(date);
                      const approvedSchedules = getApprovedSchedules(daySchedules);
                      const pendingSchedules = daySchedules.filter(s => (s.approvedCount || 0) === 0);
                      const hasApproved = approvedSchedules.length > 0;
                      const hasPending = pendingSchedules.length > 0;

                      return (
                        <div
                          key={dayIndex}
                          className={`min-h-[100px] p-2 border rounded-lg ${
                            !date
                              ? 'bg-gray-50'
                              : isToday(date)
                              ? 'bg-blue-50 border-blue-300'
                              : hasApproved
                              ? 'bg-green-50 border-green-200'
                              : hasPending
                              ? 'bg-yellow-50 border-yellow-200'
                              : 'bg-white border-gray-200'
                          } ${date ? 'hover:shadow-md transition' : ''}`}
                        >
                          {date && (
                            <>
                              <div
                                className={`text-sm font-semibold mb-1 ${
                                  dayIndex === 0
                                    ? 'text-red-600'
                                    : dayIndex === 6
                                    ? 'text-blue-600'
                                    : 'text-gray-700'
                                }`}
                              >
                                {date.getDate()}
                              </div>
                              <div className="space-y-1">
                                {/* 승인된 일정 */}
                                {approvedSchedules.map((schedule) => (
                                  <div
                                    key={schedule.id}
                                    onClick={() => handleScheduleClick(schedule)}
                                    className="text-xs p-1 bg-white rounded border border-green-300 cursor-pointer hover:bg-green-50 transition"
                                  >
                                    <div className="font-medium text-gray-900 truncate">
                                      {schedule.store?.name}
                                    </div>
                                    <div className="text-gray-600">
                                      {schedule.startTime.slice(0, 5)} - {schedule.endTime.slice(0, 5)}
                                    </div>
                                    <div className="text-green-600 font-semibold flex items-center">
                                      <span className="material-icons text-xs mr-1">check_circle</span>
                                      {schedule.approvedCount}/{schedule.requiredCount}명
                                    </div>
                                  </div>
                                ))}
                                {/* 대기 중인 일정 */}
                                {pendingSchedules.map((schedule) => (
                                  <div
                                    key={schedule.id}
                                    onClick={() => handleScheduleClick(schedule)}
                                    className="text-xs p-1 bg-white rounded border border-yellow-300 cursor-pointer hover:bg-yellow-50 transition"
                                  >
                                    <div className="font-medium text-gray-900 truncate">
                                      {schedule.store?.name}
                                    </div>
                                    <div className="text-gray-600">
                                      {schedule.startTime.slice(0, 5)} - {schedule.endTime.slice(0, 5)}
                                    </div>
                                    <div className="text-yellow-600 font-semibold flex items-center">
                                      <span className="material-icons text-xs mr-1">schedule</span>
                                      0/{schedule.requiredCount}명
                                      {getPendingCount(schedule) > 0 && (
                                        <span className="ml-2 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                                          대기 {getPendingCount(schedule)}명
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
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
        )}
      </main>

      {/* 일정 상세 모달 */}
      {showDetailModal && selectedSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900">일정 상세</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="material-icons">close</span>
              </button>
            </div>

            {/* 업체 정보 */}
            <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
              <h3 className="text-lg font-bold text-indigo-900 mb-2">
                {selectedSchedule.store?.name}
              </h3>
              {selectedSchedule.description && (
                <p className="text-gray-700">{selectedSchedule.description}</p>
              )}
            </div>

            {/* 일정 정보 */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center mb-2">
                  <span className="material-icons text-gray-600 mr-2">event</span>
                  <span className="text-sm text-gray-600">날짜</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(selectedSchedule.date).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'short'
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
                  모집 인원 {selectedSchedule.requiredCount}명 · 확정 {getApprovedCount(selectedSchedule)}명 · 잔여 {Math.max(selectedSchedule.requiredCount - getApprovedCount(selectedSchedule), 0)}명
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center mb-2">
                  <span className="material-icons text-gray-600 mr-2">payments</span>
                  <span className="text-sm text-gray-600">시급</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedSchedule.hourlyWage.toLocaleString()}원
                </p>
              </div>
            </div>

            {/* 승인된 직원 목록 */}
            {selectedSchedule.applications && 
             selectedSchedule.applications.filter(app => (isManager ? app.status === 'APPROVED' : (app.status === 'APPROVED' && app.user.id === user?.id))).length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                  <span className="material-icons mr-2 text-green-600">check_circle</span>
                  승인된 직원
                </h3>
                <div className="space-y-2">
                  {selectedSchedule.applications
                    .filter(app => (isManager ? app.status === 'APPROVED' : (app.status === 'APPROVED' && app.user.id === user?.id)))
                    .map((app) => (
                      <div
                        key={app.id}
                        className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                      >
                        <div className="flex items-center">
                          <span className="material-icons text-green-600 mr-3">person</span>
                          <p className="font-semibold text-gray-900">{app.user.name}</p>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                          승인됨
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* 대기 중인 신청 */}
            {selectedSchedule.applications && 
             selectedSchedule.applications.filter(app => (isManager ? app.status === 'PENDING' : (app.status === 'PENDING' && app.user.id === user?.id))).length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                  <span className="material-icons mr-2 text-yellow-600">hourglass_empty</span>
                  대기 중인 신청
                </h3>
                <div className="space-y-2">
                  {selectedSchedule.applications
                    .filter(app => (isManager ? app.status === 'PENDING' : (app.status === 'PENDING' && app.user.id === user?.id)))
                    .map((app) => (
                      <div
                        key={app.id}
                        className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                      >
                        <div className="flex items-center">
                          <span className="material-icons text-yellow-600 mr-3">person</span>
                          <p className="font-semibold text-gray-900">{app.user.name}</p>
                        </div>
                        {isManager ? (
                          <div className="flex items-center">
                            <button
                              disabled={actionLoading}
                              onClick={() => handleApproveApplication(app.id)}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                            >
                              승인
                            </button>
                            <button
                              disabled={actionLoading}
                              onClick={() => handleRejectApplication(app.id)}
                              className="ml-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                            >
                              거부
                            </button>
                          </div>
                        ) : (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">대기중</span>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* 신청자가 없는 경우 */}
            {(!selectedSchedule.applications || selectedSchedule.applications.length === 0) && (
              <div className="text-center py-8">
                <span className="material-icons text-gray-400 text-5xl">person_off</span>
                <p className="mt-3 text-gray-600">아직 신청한 직원이 없습니다.</p>
              </div>
            )}

            {/* 닫기 버튼 */}
            <div className="flex justify-end mt-6">
              <button
                onClick={closeModal}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleCalendar;
