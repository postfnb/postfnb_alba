import React, { useMemo, useState } from 'react';
import { Schedule } from '../services/schedules';

interface ScheduleCalendarWidgetProps {
  schedules: Schedule[];
  title?: string;
  subtitle?: string;
  onApplySchedule?: (schedule: Schedule) => void;
  onApproveApplication?: (applicationId: string) => Promise<void> | void;
  onRejectApplication?: (applicationId: string) => Promise<void> | void;
  currentUserId?: string;
  onScheduleClick?: (schedule: Schedule) => void;
  disableDetailModal?: boolean;
}

const ScheduleCalendarWidget: React.FC<ScheduleCalendarWidgetProps> = ({
  schedules,
  title = '전체 일정 달력',
  subtitle = '월별 일정 현황을 확인하세요',
  onApplySchedule,
  onApproveApplication,
  onRejectApplication,
  currentUserId,
  onScheduleClick,
  disableDetailModal = false,
}) => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [processingApplicationId, setProcessingApplicationId] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<'approve' | 'reject' | null>(null);

  const calendarData = useMemo(() => {
    const monthKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`;
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const monthSchedules = schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.date);
      return (
        scheduleDate.getFullYear() === currentMonth.getFullYear() &&
        scheduleDate.getMonth() === currentMonth.getMonth()
      );
    });

    const dayMap = new Map<number, Schedule[]>();
    monthSchedules.forEach(schedule => {
      const day = new Date(schedule.date).getDate();
      const existing = dayMap.get(day) || [];
      existing.push(schedule);
      dayMap.set(day, existing);
    });

    const weeks: { date: Date | null; schedules: Schedule[] }[][] = [];
    let week: { date: Date | null; schedules: Schedule[] }[] = [];

    for (let i = 0; i < firstDay.getDay(); i++) {
      week.push({ date: null, schedules: [] });
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const schedulesForDay = dayMap.get(day) || [];
      week.push({ date: dateObj, schedules: schedulesForDay });

      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }

    if (week.length > 0) {
      while (week.length < 7) {
        week.push({ date: null, schedules: [] });
      }
      weeks.push(week);
    }

    return { key: monthKey, weeks, monthSchedules };
  }, [currentMonth, schedules]);

  const getStatus = (schedule: Schedule & { applicationStatus?: string }) => {
    if (schedule.applicationStatus) {
      if (schedule.applicationStatus === 'APPROVED') return 'filled';
      if (schedule.applicationStatus === 'REJECTED') return 'rejected';
      if (schedule.applicationStatus === 'PENDING') return 'partial';
    }
    const approved = schedule.approvedCount || 0;
    if (approved >= schedule.requiredCount) {
      return 'filled';
    }
    if (approved > 0) {
      return 'partial';
    }
    return 'pending';
  };

  const changeMonth = (offset: number) => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleScheduleClick = (schedule: Schedule) => {
    if (onScheduleClick) {
      onScheduleClick(schedule);
    }
    if (!disableDetailModal) {
      setSelectedSchedule(schedule);
      setShowDetailModal(true);
    }
  };

  const closeModal = () => {
    setSelectedSchedule(null);
    setShowDetailModal(false);
  };

  const renderStatusBadge = () => {
    if (calendarData.monthSchedules.length === 0) {
      return null;
    }

    const filled = calendarData.monthSchedules.filter(
      schedule => getStatus(schedule) === 'filled'
    ).length;
    const partial = calendarData.monthSchedules.filter(
      schedule => getStatus(schedule) === 'partial'
    ).length;
    const pending = calendarData.monthSchedules.filter(
      schedule => getStatus(schedule) === 'pending'
    ).length;

    return (
      <div className="flex flex-wrap gap-3 text-sm">
        <span className="flex items-center">
          <span className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></span>
          마감 {filled}건
        </span>
        <span className="flex items-center">
          <span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
          진행중 {partial}건
        </span>
        <span className="flex items-center">
          <span className="w-3 h-3 rounded-full bg-gray-300 mr-2"></span>
          모집중 {pending}건
        </span>
      </div>
    );
  };

  const scheduleDetail = showDetailModal && selectedSchedule ? selectedSchedule : null;
  const userApplication = scheduleDetail?.applications?.find(
    (app) => app.user?.id === currentUserId
  );
  const isApplyDisabled = Boolean(
    !onApplySchedule || !currentUserId || (userApplication && (userApplication.status === 'PENDING' || userApplication.status === 'APPROVED'))
  );
  const handleApplyFromModal = () => {
    if (isApplyDisabled) {
      return;
    }
    if (scheduleDetail) {
      onApplySchedule?.(scheduleDetail);
      closeModal();
    }
  };
  const handleApprove = async (applicationId: string) => {
    if (!onApproveApplication) return;
    try {
      setProcessingApplicationId(applicationId);
      setProcessingAction('approve');
      await onApproveApplication(applicationId);
    } finally {
      setProcessingApplicationId(null);
      setProcessingAction(null);
    }
  };
  const handleReject = async (applicationId: string) => {
    if (!onRejectApplication) return;
    try {
      setProcessingApplicationId(applicationId);
      setProcessingAction('reject');
      await onRejectApplication(applicationId);
    } finally {
      setProcessingApplicationId(null);
      setProcessingAction(null);
    }
  };
  const approvedApplications = scheduleDetail?.applications?.filter(
    (app) => app.status === 'APPROVED'
  ) ?? [];
  const pendingApplications = scheduleDetail?.applications?.filter(
    (app) => app.status === 'PENDING'
  ) ?? [];
  const hasAnyApplications = (scheduleDetail?.applications?.length ?? 0) > 0;

  return (
    <>
      <section className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            {title && <h2 className="text-2xl font-bold text-gray-900">{title}</h2>}
            {subtitle && <p className="mt-2 text-sm text-gray-500">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => changeMonth(-1)}
              className="p-2 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              <span className="material-icons text-base">chevron_left</span>
            </button>
            <div className="text-gray-900 font-semibold">
              {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
            </div>
            <button
              onClick={() => changeMonth(1)}
              className="p-2 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              <span className="material-icons text-base">chevron_right</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <div className="grid grid-cols-7 gap-2 text-center text-sm font-semibold text-gray-600 mb-2">
              {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                <div key={day}>{day}</div>
              ))}
            </div>

            <div className="space-y-2">
              {calendarData.weeks.map((week, weekIndex) => (
                <div key={`${calendarData.key}-${weekIndex}`} className="grid grid-cols-7 gap-2">
                  {week.map((cell, dayIndex) => {
                    if (!cell.date) {
                      return (
                        <div
                          key={`empty-${weekIndex}-${dayIndex}`}
                          className="h-24 rounded-lg border border-dashed border-gray-200"
                        />
                      );
                    }

                    const dateLabel = cell.date.getDate();
                    const isToday = cell.date.getTime() === today.getTime();
                    const statusCounts = cell.schedules.reduce(
                      (acc, schedule) => {
                        const status = getStatus(schedule) as 'filled' | 'partial' | 'pending' | 'rejected';
                        acc[status] = (acc[status] || 0) + 1;
                        return acc;
                      },
                      { filled: 0, partial: 0, pending: 0, rejected: 0 } as Record<'filled' | 'partial' | 'pending' | 'rejected', number>
                    );

                    return (
                      <div
                        key={`${cell.date.toISOString()}-${dayIndex}`}
                        className={`h-24 rounded-lg border p-2 flex flex-col transition ${
                          isToday ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span
                            className={`font-semibold ${
                              dayIndex === 0
                                ? 'text-red-600'
                                : dayIndex === 6
                                ? 'text-blue-600'
                                : 'text-gray-900'
                            }`}
                          >
                            {dateLabel}
                          </span>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            {statusCounts.filled > 0 && (
                              <span className="flex items-center">
                                <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                                {statusCounts.filled}
                              </span>
                            )}
                            {statusCounts.partial > 0 && (
                              <span className="flex items-center">
                                <span className="w-2 h-2 rounded-full bg-yellow-500 mr-1"></span>
                                {statusCounts.partial}
                              </span>
                            )}
                            {statusCounts.rejected > 0 && (
                              <span className="flex items-center">
                                <span className="w-2 h-2 rounded-full bg-red-500 mr-1"></span>
                                {statusCounts.rejected}
                              </span>
                            )}
                            {statusCounts.pending > 0 && (
                              <span className="flex items-center">
                                <span className="w-2 h-2 rounded-full bg-gray-300 mr-1"></span>
                                {statusCounts.pending}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-1 pr-1 text-xs">
                          {cell.schedules.slice(0, 3).map(schedule => (
                            <div
                              key={schedule.id}
                              onClick={() => handleScheduleClick(schedule)}
                              className={`px-2 py-1 rounded border text-left cursor-pointer hover:shadow-sm transition ${
                                getStatus(schedule) === 'filled'
                                  ? 'border-green-200 bg-green-50 text-green-700'
                                  : getStatus(schedule) === 'partial'
                                  ? 'border-yellow-200 bg-yellow-50 text-yellow-700'
                                  : getStatus(schedule) === 'rejected'
                                  ? 'border-red-200 bg-red-50 text-red-700'
                                  : 'border-gray-200 bg-gray-50 text-gray-600'
                              }`}
                            >
                              <div className="font-medium truncate">
                                {schedule.store?.name || '미지정 매장'}
                              </div>
                              <div className="text-[11px]">
                                {(schedule.startTime || '').slice(0, 5)} - {(schedule.endTime || '').slice(0, 5)}
                              </div>
                            </div>
                          ))}
                          {cell.schedules.length > 3 && (
                            <div className="text-[11px] text-gray-500">+{cell.schedules.length - 3}개 일정</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {renderStatusBadge()}
      </section>

      {scheduleDetail && (
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

            <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
              <h3 className="text-lg font-bold text-indigo-900 mb-2">
                {scheduleDetail.store?.name || '미지정 매장'}
              </h3>
              {scheduleDetail.description && (
                <p className="text-gray-700">{scheduleDetail.description}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center mb-2">
                  <span className="material-icons text-gray-600 mr-2">event</span>
                  <span className="text-sm text-gray-600">날짜</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(scheduleDetail.date).toLocaleDateString('ko-KR', {
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
                  {(scheduleDetail.startTime || '').slice(0, 5)} - {(scheduleDetail.endTime || '').slice(0, 5)}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center mb-2">
                  <span className="material-icons text-gray-600 mr-2">people</span>
                  <span className="text-sm text-gray-600">인원</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  <span className="text-green-600">{scheduleDetail.approvedCount || 0}</span>
                  <span className="text-gray-400"> / </span>
                  {scheduleDetail.requiredCount}명
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center mb-2">
                  <span className="material-icons text-gray-600 mr-2">payments</span>
                  <span className="text-sm text-gray-600">시급</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {scheduleDetail.hourlyWage.toLocaleString()}원
                </p>
              </div>
            </div>

            {approvedApplications.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                  <span className="material-icons mr-2 text-green-600">check_circle</span>
                  승인된 직원
                </h3>
                <div className="space-y-2">
                  {approvedApplications.map(app => (
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

            {pendingApplications.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                  <span className="material-icons mr-2 text-yellow-600">hourglass_empty</span>
                  대기 중인 신청
                </h3>
                <div className="space-y-2">
                  {pendingApplications.map(app => (
                    <div
                      key={app.id}
                      className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                    >
                      <div className="flex items-center">
                        <span className="material-icons text-yellow-600 mr-3">person</span>
                        <div>
                          <p className="font-semibold text-gray-900">{app.user.name}</p>
                          <p className="text-sm text-gray-600">{app.user.email}</p>
                        </div>
                      </div>
                      {(onApproveApplication || onRejectApplication) ? (
                        <div className="flex items-center space-x-2">
                          {onApproveApplication && (
                            <button
                              onClick={() => handleApprove(app.id)}
                              disabled={processingApplicationId === app.id}
                              className="px-3 py-1 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:bg-emerald-400"
                            >
                              {processingApplicationId === app.id && processingAction === 'approve' ? '승인 중...' : '승인'}
                            </button>
                          )}
                          {onRejectApplication && (
                            <button
                              onClick={() => handleReject(app.id)}
                              disabled={processingApplicationId === app.id}
                              className="px-3 py-1 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:bg-red-400"
                            >
                              {processingApplicationId === app.id && processingAction === 'reject' ? '거부 중...' : '거부'}
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                          대기중
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!hasAnyApplications && (
              <div className="text-center py-8">
                <span className="material-icons text-gray-400 text-5xl">person_off</span>
                <p className="mt-3 text-gray-600">신청한 직원이 없습니다.</p>
              </div>
            )}

            <div className="flex justify-end mt-6 space-x-3">
              {onApplySchedule && (
                <button
                  onClick={handleApplyFromModal}
                  disabled={isApplyDisabled}
                  className={`px-6 py-2 rounded-lg transition ${
                    isApplyDisabled
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  신청하기
                </button>
              )}
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
    </>
  );
};

export default ScheduleCalendarWidget;
