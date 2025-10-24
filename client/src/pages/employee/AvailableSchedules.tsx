import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { scheduleService, Schedule } from '../../services/schedules';
import { applicationService } from '../../services/applications';
import { useAuthStore } from '../../store/authStore';
import ScheduleCalendarWidget from '../../components/ScheduleCalendarWidget';

interface ScheduleGroup {
  key: string;
  storeName: string;
  startTime: string;
  endTime: string;
  hourlyWage: number;
  description: string;
  schedules: Schedule[];
}

const AvailableSchedules: React.FC = () => {
  const [scheduleGroups, setScheduleGroups] = useState<ScheduleGroup[]>([]);
  const [availableSchedules, setAvailableSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ScheduleGroup | null>(null);
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>([]);
  const [message, setMessage] = useState('');

  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      setIsLoading(true);
      const data = await scheduleService.getSchedules({ status: 'available' });
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const futureSchedules = data.filter(schedule => {
        const scheduleDate = new Date(schedule.date);
        return scheduleDate >= today;
      });

      setAvailableSchedules(futureSchedules);
      
      // 업체별, 시간대별로 그룹화
      const grouped: { [key: string]: Schedule[] } = {};
      futureSchedules.forEach(schedule => {
        const key = `${schedule.store?.name}_${schedule.startTime}_${schedule.endTime}_${schedule.hourlyWage}_${schedule.description || ''}`;
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(schedule);
      });

      // ScheduleGroup 배열로 변환
      const groups: ScheduleGroup[] = Object.entries(grouped).map(([key, schedules]) => ({
        key,
        storeName: schedules[0].store?.name || '',
        startTime: schedules[0].startTime,
        endTime: schedules[0].endTime,
        hourlyWage: schedules[0].hourlyWage,
        description: schedules[0].description || '',
        schedules: schedules.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      }));

      setScheduleGroups(groups);
    } catch (err: any) {
      setError(err.response?.data?.message || '일정을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedScheduleIds.length === 0) return;

    try {
      await Promise.all(
        selectedScheduleIds.map(scheduleId =>
          applicationService.createApplication({
            scheduleId,
            message,
          })
        )
      );
      
      alert(`${selectedScheduleIds.length}개의 일정에 신청이 완료되었습니다!`);
      setShowApplyModal(false);
      setSelectedGroup(null);
      setSelectedScheduleIds([]);
      setMessage('');
      loadSchedules();
    } catch (err: any) {
      alert(err.response?.data?.message || '신청에 실패했습니다.');
    }
  };

  const toggleScheduleSelection = (scheduleId: string) => {
    setSelectedScheduleIds(prev => {
      if (prev.includes(scheduleId)) {
        return prev.filter(id => id !== scheduleId);
      } else {
        return [...prev, scheduleId];
      }
    });
  };

  const selectAllDates = () => {
    if (!selectedGroup) return;
    setSelectedScheduleIds(selectedGroup.schedules.map(s => s.id));
  };

  const deselectAllDates = () => {
    setSelectedScheduleIds([]);
  };

  const openApplyModalForSchedule = (schedule: Schedule) => {
    const group = scheduleGroups.find((g) => g.schedules.some((s) => s.id === schedule.id));

    if (group) {
      setSelectedGroup(group);
      setSelectedScheduleIds([schedule.id]);
      setMessage('');
      setShowApplyModal(true);
      return;
    }

    const fallbackGroup: ScheduleGroup = {
      key: schedule.id,
      storeName: schedule.store?.name || '',
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      hourlyWage: schedule.hourlyWage,
      description: schedule.description || '',
      schedules: [schedule],
    };

    setSelectedGroup(fallbackGroup);
    setSelectedScheduleIds([schedule.id]);
    setMessage('');
    setShowApplyModal(true);
  };

  const calculateWorkHours = (startTime: string, endTime: string) => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    return endHour - startHour + (endMin - startMin) / 60;
  };

  const calculateEstimatedPay = (hourlyWage: number, startTime: string, endTime: string) => {
    const hours = calculateWorkHours(startTime, endTime);
    return Math.floor(hours * hourlyWage);
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
              <span className="material-icons text-indigo-600">work</span>
              <span className="text-xl font-bold text-gray-900">알바 찾기</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/my-applications')}
                className="flex items-center px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
              >
                <span className="material-icons mr-1 text-sm">assignment</span>
                내 신청 내역
              </button>
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
        <ScheduleCalendarWidget
          schedules={availableSchedules}
          title="전체 근무 달력"
          subtitle="신청 가능한 일정을 월별로 확인하세요"
          onApplySchedule={openApplyModalForSchedule}
          currentUserId={user?.id}
        />

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">신청 가능한 알바</h1>
          <p className="text-gray-600 mt-1">원하는 날짜를 선택해서 신청하세요</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {/* 일정 그룹 목록 */}
        <div className="space-y-6">
          {scheduleGroups.map((group) => {
            const workHours = calculateWorkHours(group.startTime, group.endTime);
            const estimatedPay = calculateEstimatedPay(group.hourlyWage, group.startTime, group.endTime);
            
            return (
              <div key={group.key} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="material-icons text-indigo-600 mr-2">store</span>
                      <h3 className="text-lg font-bold text-gray-900">{group.storeName}</h3>
                    </div>
                    {group.description && (
                      <p className="text-gray-600 mb-3">{group.description}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-4 text-sm mb-4">
                      <div className="flex items-center">
                        <span className="material-icons text-gray-400 text-sm mr-1">schedule</span>
                        <span>{group.startTime} - {group.endTime} ({workHours}시간)</span>
                      </div>
                      <div className="flex items-center">
                        <span className="material-icons text-gray-400 text-sm mr-1">payments</span>
                        <span>{group.hourlyWage.toLocaleString()}원/시간</span>
                      </div>
                      <div className="flex items-center">
                        <span className="material-icons text-gray-400 text-sm mr-1">account_balance_wallet</span>
                        <span className="font-semibold text-indigo-600">
                          예상 급여: {estimatedPay.toLocaleString()}원
                        </span>
                      </div>
                    </div>

                    {/* 날짜 목록 */}
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        신청 가능한 날짜 ({group.schedules.length}일)
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {group.schedules.slice(0, 10).map((schedule) => (
                          <span
                            key={schedule.id}
                            className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                          >
                            {new Date(schedule.date).toLocaleDateString('ko-KR', {
                              month: 'short',
                              day: 'numeric',
                              weekday: 'short',
                            })}
                          </span>
                        ))}
                        {group.schedules.length > 10 && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-500 text-sm rounded-full">
                            +{group.schedules.length - 10}일 더보기
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedGroup(group);
                    setSelectedScheduleIds([]);
                    setShowApplyModal(true);
                  }}
                  className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
                >
                  날짜 선택하고 신청하기
                </button>
              </div>
            );
          })}
        </div>

        {scheduleGroups.length === 0 && !error && (
          <div className="text-center py-12">
            <span className="material-icons text-gray-400 text-6xl">work_off</span>
            <p className="mt-4 text-gray-600">현재 신청 가능한 알바가 없습니다.</p>
          </div>
        )}
      </main>

      {/* 날짜 선택 및 신청 모달 */}
      {showApplyModal && selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">날짜 선택 및 신청</h2>
            
            {/* 일정 정보 */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold mb-2">{selectedGroup.storeName}</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p>🕐 {selectedGroup.startTime} - {selectedGroup.endTime}</p>
                <p>💰 {selectedGroup.hourlyWage.toLocaleString()}원/시간</p>
                <p className="font-semibold text-indigo-600">
                  예상 급여: {calculateEstimatedPay(selectedGroup.hourlyWage, selectedGroup.startTime, selectedGroup.endTime).toLocaleString()}원
                </p>
              </div>
            </div>

            <form onSubmit={handleApply} className="space-y-4">
              {/* 날짜 선택 */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    근무 날짜 선택 ({selectedScheduleIds.length}개 선택됨)
                  </label>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={selectAllDates}
                      className="text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      전체 선택
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={deselectAllDates}
                      className="text-sm text-gray-600 hover:text-gray-700"
                    >
                      선택 해제
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 border rounded-lg">
                  {selectedGroup.schedules.map((schedule) => {
                    const isSelected = selectedScheduleIds.includes(schedule.id);
                    return (
                      <button
                        key={schedule.id}
                        type="button"
                        onClick={() => toggleScheduleSelection(schedule.id)}
                        className={`p-3 rounded-lg border text-sm transition ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {new Date(schedule.date).toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                          weekday: 'short',
                        })}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 신청 메시지 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  신청 메시지 (선택사항)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  placeholder="열심히 일하겠습니다!"
                />
              </div>

              {/* 버튼 */}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowApplyModal(false);
                    setSelectedGroup(null);
                    setSelectedScheduleIds([]);
                    setMessage('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={selectedScheduleIds.length === 0}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {selectedScheduleIds.length}개 일정 신청하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailableSchedules;
