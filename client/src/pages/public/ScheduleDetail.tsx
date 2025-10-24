import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { publicScheduleService, Schedule } from '../../services/schedules';
import { applicationService } from '../../services/applications';
import { useAuthStore } from '../../store/authStore';

const ScheduleDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();

  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | ''>('');

  const fetchSchedule = useCallback(async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      setError('');
      const data = await publicScheduleService.getSchedule(id);
      setSchedule(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || '일정을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const formattedDate = useMemo(() => {
    if (!schedule) return '';
    try {
      return new Date(schedule.date).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      });
    } catch {
      return schedule.date;
    }
  }, [schedule]);

  const approvedCount = schedule?.approvedCount ?? 0;
  const remainingSlots = useMemo(() => {
    if (!schedule) return 0;
    return Math.max(schedule.requiredCount - (schedule.approvedCount || 0), 0);
  }, [schedule]);

  const hasApplied = useMemo(() => {
    if (!user || !schedule?.applications) return false;
    return schedule.applications.some((application) => application.user?.id === user.id);
  }, [schedule, user]);

  const isFull = schedule ? approvedCount >= schedule.requiredCount : false;
  const canApply = Boolean(schedule && !isFull && !hasApplied);

  const handleApply = async () => {
    if (!schedule) return;

    if (!user) {
      navigate('/login', { state: { redirectTo: `/schedule/${schedule.id}` } });
      return;
    }

    if (user.role !== 'EMPLOYEE') {
      setFeedback('직원 계정으로 로그인해야 신청할 수 있습니다.');
      setFeedbackType('error');
      return;
    }

    if (!canApply) {
      setFeedback(hasApplied ? '이미 신청한 일정입니다.' : '현재 신청이 불가능한 일정입니다.');
      setFeedbackType('error');
      return;
    }

    try {
      setIsApplying(true);
      setFeedback('');
      setFeedbackType('');
      await applicationService.createApplication({ scheduleId: schedule.id });
      setFeedback('신청이 완료되었습니다! 일정 담당자가 검토 후 연락드립니다.');
      setFeedbackType('success');
      await fetchSchedule();
    } catch (err: any) {
      setFeedback(err?.response?.data?.message || '신청 중 오류가 발생했습니다.');
      setFeedbackType('error');
    } finally {
      setIsApplying(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-rose-400">Post FNB</p>
            <h1 className="mt-1 text-xl font-semibold">근무 일정 상세</h1>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/index')}
              className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-gray-700 transition hover:bg-gray-100"
            >
              메인으로
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-rose-400"
            >
              직원 로그인
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <button
          type="button"
          onClick={handleBack}
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-gray-900"
        >
          <span className="material-icons text-base">arrow_back</span>
          뒤로가기
        </button>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <span className="material-icons animate-spin text-rose-400 text-5xl">refresh</span>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center text-red-600">
            {error}
          </div>
        ) : !schedule ? (
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-8 text-center text-gray-600">
            일정을 찾을 수 없습니다.
          </div>
        ) : (
          <div className="space-y-10">
            <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">{schedule.store?.name || '미지정 매장'}</h2>
                  <p className="mt-2 text-sm text-gray-500">{formattedDate}</p>
                  <div className="mt-4 grid gap-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="material-icons text-gray-400">schedule</span>
                      <span>
                        {schedule.startTime} - {schedule.endTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-icons text-gray-400">payments</span>
                      <span>{schedule.hourlyWage.toLocaleString()}원 / 시간</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-icons text-gray-400">groups</span>
                      <span>
                        모집 인원 {schedule.requiredCount}명 · 확정 {approvedCount}명 · 잔여 {remainingSlots}명
                      </span>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl bg-rose-50 px-6 py-6 text-sm text-rose-600">
                  <p className="font-semibold">근무 소개</p>
                  <p className="mt-2 whitespace-pre-line text-rose-700">
                    {schedule.description || '상세 설명이 제공되지 않았습니다.'}
                  </p>
                </div>
              </div>

              {feedback && (
                <div
                  className={`mt-6 rounded-2xl px-4 py-3 text-sm ${
                    feedbackType === 'success'
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : 'bg-red-50 text-red-600 border border-red-200'
                  }`}
                >
                  {feedback}
                </div>
              )}

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={isApplying || !canApply}
                  className={`rounded-full px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                    isApplying
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : canApply
                      ? 'bg-rose-500 text-white hover:bg-rose-400'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isApplying ? '신청 중...' : hasApplied ? '신청 완료' : isFull ? '모집 마감' : '신청하기'}
                </button>
                {isFull && (
                  <span className="text-sm text-gray-500">해당 일정은 모집이 마감되었습니다.</span>
                )}
                {hasApplied && (
                  <span className="text-sm text-gray-500">이미 신청한 일정입니다.</span>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">근무 위치 및 안내</h3>
              <div className="mt-4 space-y-4 text-sm text-gray-600">
                <p>정확한 근무 장소와 상세 안내는 신청 승인 후 매니저가 별도로 안내해 드립니다.</p>
                <div className="flex items-start gap-3">
                  <span className="material-icons text-rose-400">tips_and_updates</span>
                  <p>
                    근무 전 간단한 오리엔테이션이 진행되며, 서비스 매뉴얼과 담당 업무를 안내해 드립니다.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="material-icons text-rose-400">workspace_premium</span>
                  <p>
                    우수 근무자에게는 정규직 전환 기회 및 식사·교통비 지원 등 다양한 혜택이 준비되어 있습니다.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default ScheduleDetail;
