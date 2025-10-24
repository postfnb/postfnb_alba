import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { applicationService, ApplicationDetail } from '../../services/applications';
import { useAuthStore } from '../../store/authStore';
import ScheduleCalendarWidget from '../../components/ScheduleCalendarWidget';
import { Schedule } from '../../services/schedules';

const MyApplications: React.FC = () => {
  const [applications, setApplications] = useState<ApplicationDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    loadApplications();
  }, [selectedStatus]);

  const loadApplications = async () => {
    try {
      setIsLoading(true);
      const data = await applicationService.getApplications(
        selectedStatus ? { status: selectedStatus } : {}
      );
      setApplications(data);
    } catch (err: any) {
      setError(err.response?.data?.message || '신청 내역을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('신청을 취소하시겠습니까?')) {
      return;
    }

    try {
      await applicationService.cancelApplication(id);
      loadApplications();
    } catch (err: any) {
      alert(err.response?.data?.message || '취소에 실패했습니다.');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      PENDING: (
        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full flex items-center">
          <span className="material-icons text-sm mr-1">schedule</span>
          대기중
        </span>
      ),
      APPROVED: (
        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full flex items-center">
          <span className="material-icons text-sm mr-1">check_circle</span>
          승인됨
        </span>
      ),
      REJECTED: (
        <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full flex items-center">
          <span className="material-icons text-sm mr-1">cancel</span>
          거부됨
        </span>
      ),
      CANCELLED: (
        <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full flex items-center">
          <span className="material-icons text-sm mr-1">block</span>
          취소됨
        </span>
      ),
    };
    return badges[status as keyof typeof badges] || status;
  };

  const calculateWorkHours = (startTime: string, endTime: string) => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const hours = endHour - startHour + (endMin - startMin) / 60;
    return hours;
  };

  const calculateEstimatedPay = (schedule: ApplicationDetail['schedule']) => {
    const hours = calculateWorkHours(schedule.startTime, schedule.endTime);
    return Math.floor(hours * schedule.hourlyWage);
  };

  const getStatusStats = () => {
    return {
      total: applications.length,
      pending: applications.filter(a => a.status === 'PENDING').length,
      approved: applications.filter(a => a.status === 'APPROVED').length,
      rejected: applications.filter(a => a.status === 'REJECTED').length,
    };
  };

  const stats = getStatusStats();

  const calendarSchedules = useMemo(() => {
    return applications.map((app): Schedule & { applicationStatus?: string } => ({
      id: app.schedule.id,
      storeId: app.schedule.store.id,
      date: app.schedule.date,
      startTime: app.schedule.startTime,
      endTime: app.schedule.endTime,
      requiredCount: 1,
      hourlyWage: app.schedule.hourlyWage,
      description: app.schedule.description,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      store: app.schedule.store,
      applications: [{
        id: app.id,
        status: app.status,
        user: app.user,
      }],
      approvedCount: app.status === 'APPROVED' ? 1 : app.status === 'PENDING' ? 0 : 0,
      isAvailable: false,
      remainingSlots: 0,
      applicationStatus: app.status,
    }));
  }, [applications]);

  const [selectedSchedule, setSelectedSchedule] = useState<ApplicationDetail | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const handleScheduleClick = (schedule: Schedule) => {
    const app = applications.find(a => a.schedule.id === schedule.id);
    if (app) {
      setSelectedSchedule(app);
      setShowDetailModal(true);
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
              <span className="material-icons text-indigo-600">assignment</span>
              <span className="text-xl font-bold text-gray-900">내 신청 내역</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/available-schedules')}
                className="flex items-center px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
              >
                <span className="material-icons mr-1 text-sm">work</span>
                알바 찾기
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
        {/* 달력 위젯 */}
        <ScheduleCalendarWidget
          schedules={calendarSchedules}
          title="내 신청 일정 달력"
          subtitle="신청한 일정을 월별로 확인하고 클릭하여 상세 정보를 확인하세요"
          onScheduleClick={handleScheduleClick}
          disableDetailModal
        />

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">전체 신청</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <span className="material-icons text-gray-400 text-3xl">assignment</span>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">대기중</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <span className="material-icons text-yellow-400 text-3xl">schedule</span>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">승인됨</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <span className="material-icons text-green-400 text-3xl">check_circle</span>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">거부됨</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <span className="material-icons text-red-400 text-3xl">cancel</span>
            </div>
          </div>
        </div>

        {/* 필터 */}
        <div className="mb-6 flex justify-between items-center">
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
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {/* 신청 목록 */}
        <div className="space-y-4">
          {applications.map((application) => {
            const estimatedPay = calculateEstimatedPay(application.schedule);
            const workHours = calculateWorkHours(
              application.schedule.startTime,
              application.schedule.endTime
            );

            return (
              <div key={application.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        {application.schedule.store.name}
                      </h3>
                      {getStatusBadge(application.status)}
                    </div>
                    {application.schedule.description && (
                      <p className="text-gray-600">{application.schedule.description}</p>
                    )}
                  </div>
                </div>

                {/* 일정 정보 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <span className="material-icons text-gray-400 text-sm mr-2">event</span>
                      <span>{new Date(application.schedule.date).toLocaleDateString('ko-KR')}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="material-icons text-gray-400 text-sm mr-2">schedule</span>
                      <span>
                        {application.schedule.startTime} - {application.schedule.endTime} ({workHours}시간)
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <span className="material-icons text-gray-400 text-sm mr-2">payments</span>
                      <span>{application.schedule.hourlyWage.toLocaleString()}원/시간</span>
                    </div>
                    <div className="flex items-center">
                      <span className="material-icons text-gray-400 text-sm mr-2">account_balance_wallet</span>
                      <span className="font-semibold text-indigo-600">
                        예상 급여: {estimatedPay.toLocaleString()}원
                      </span>
                    </div>
                  </div>
                </div>

                {/* 신청 메시지 */}
                {application.message && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">내 메시지:</span> {application.message}
                    </p>
                  </div>
                )}

                {/* 거부 사유 */}
                {application.rejectReason && (
                  <div className="mb-4 p-3 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-700">
                      <span className="font-semibold">거부 사유:</span> {application.rejectReason}
                    </p>
                  </div>
                )}

                {/* 하단 정보 */}
                <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
                  <span>신청일: {new Date(application.createdAt).toLocaleString('ko-KR')}</span>
                  
                  {application.status === 'PENDING' && (
                    <button
                      onClick={() => handleCancel(application.id)}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      신청 취소
                    </button>
                  )}
                  
                  {application.status === 'APPROVED' && (
                    <span className="px-3 py-1 bg-green-50 text-green-700 rounded-lg font-semibold">
                      ✓ 근무 확정
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {applications.length === 0 && !error && (
          <div className="text-center py-12">
            <span className="material-icons text-gray-400 text-6xl">assignment</span>
            <p className="mt-4 text-gray-600">신청 내역이 없습니다.</p>
            <button
              onClick={() => navigate('/available-schedules')}
              className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              알바 찾으러 가기
            </button>
          </div>
        )}
      </main>

      {/* 상세 모달 */}
      {showDetailModal && selectedSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900">신청 상세 정보</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="material-icons">close</span>
              </button>
            </div>

            <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
              <h3 className="text-lg font-bold text-indigo-900 mb-2">
                {selectedSchedule.schedule.store.name}
              </h3>
              {selectedSchedule.schedule.description && (
                <p className="text-gray-700">{selectedSchedule.schedule.description}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center mb-2">
                  <span className="material-icons text-gray-600 mr-2">event</span>
                  <span className="text-sm text-gray-600">날짜</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(selectedSchedule.schedule.date).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'short',
                  })}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center mb-2">
                  <span className="material-icons text-gray-600 mr-2">schedule</span>
                  <span className="text-sm text-gray-600">근무 시간</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedSchedule.schedule.startTime} - {selectedSchedule.schedule.endTime}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center mb-2">
                  <span className="material-icons text-gray-600 mr-2">payments</span>
                  <span className="text-sm text-gray-600">시급</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedSchedule.schedule.hourlyWage.toLocaleString()}원
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center mb-2">
                  <span className="material-icons text-gray-600 mr-2">account_balance_wallet</span>
                  <span className="text-sm text-gray-600">예상 급여</span>
                </div>
                <p className="text-lg font-semibold text-indigo-600">
                  {calculateEstimatedPay(selectedSchedule.schedule).toLocaleString()}원
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">신청 상태</h3>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                {getStatusBadge(selectedSchedule.status)}
                <span className="text-sm text-gray-500">
                  신청일: {new Date(selectedSchedule.createdAt).toLocaleDateString('ko-KR')}
                </span>
              </div>
            </div>

            {selectedSchedule.message && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">내 메시지:</span> {selectedSchedule.message}
                </p>
              </div>
            )}

            {selectedSchedule.rejectReason && (
              <div className="mb-6 p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-red-700">
                  <span className="font-semibold">거부 사유:</span> {selectedSchedule.rejectReason}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              {selectedSchedule.status === 'PENDING' && (
                <button
                  onClick={() => {
                    handleCancel(selectedSchedule.id);
                    setShowDetailModal(false);
                  }}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  신청 취소
                </button>
              )}
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
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

export default MyApplications;
