import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ScheduleCalendarWidget from '../../components/ScheduleCalendarWidget';
import { publicScheduleService, Schedule } from '../../services/schedules';

const HomeLanding: React.FC = () => {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const availableSchedules = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return schedules.filter((schedule) => {
      const approved = schedule.approvedCount ?? 0;
      const remaining = Math.max(schedule.requiredCount - approved, 0);

      const dateValue = new Date(schedule.date);
      if (!Number.isFinite(dateValue.getTime())) {
        return remaining > 0;
      }
      dateValue.setHours(0, 0, 0, 0);
      return remaining > 0 && dateValue >= today;
    });
  }, [schedules]);

  useEffect(() => {
    const loadSchedules = async () => {
      try {
        setIsLoading(true);
        setError('');
        const data = await publicScheduleService.getSchedules({
          status: 'available',
          includeClosed: false,
        });
        setSchedules(data);
      } catch (err: any) {
        setError(err?.response?.data?.message || '근무 일정을 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadSchedules();
  }, []);

  const scrollToRecruit = () => {
    const element = document.getElementById('recruit');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1612874479990-d0bc15424306?auto=format&fit=crop&w=1920&q=80"
            alt="숯불 위에 구워지는 고기"
            className="h-full w-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-black/70" />
        </div>
        <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-6 py-20 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-rose-200">Post FNB Premium Grill</p>
          <h1 className="mt-6 text-3xl font-light leading-tight sm:text-5xl">
            숯불 위에서 완성되는 한우 & 돼지고기 모던 다이닝
          </h1>
          <p className="mt-6 max-w-2xl text-base text-gray-200 sm:text-lg">
            신선한 재료와 정성 가득한 서비스로 고객에게 최고의 순간을 선사합니다. 불꽃과 사람의 조화, Post FNB에서 함께할 인재를 기다립니다.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={scrollToRecruit}
              className="rounded-full bg-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-gray-900 transition hover:bg-rose-200"
            >
              알바 모집 일정 보기
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="rounded-full border border-white/40 px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-white/10"
            >
              직원 포털 로그인
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16 space-y-20">
        <section className="grid gap-6 md:grid-cols-3">
          {[{
            title: '장인의 화력',
            description: '한우와 돼지고기의 최적의 풍미를 이끌어내는 숯불 화력과 전문 셰프의 손길을 느껴보세요.',
            icon: 'local_fire_department',
          }, {
            title: '프리미엄 재료',
            description: '도축 직후 숙성 과정을 거친 한우와 제주 흑돼지를 사용하여 최고의 맛을 보장합니다.',
            icon: 'restaurant',
          }, {
            title: '팀워크 중심 문화',
            description: '함께 일하는 동료들과의 조화, 고객을 위한 서비스 마인드가 Post FNB의 핵심 가치입니다.',
            icon: 'diversity_3',
          }].map((feature) => (
            <div
              key={feature.title}
              className="rounded-3xl border border-gray-200 bg-white/90 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <span className="material-icons text-rose-500 text-4xl">{feature.icon}</span>
              <h3 className="mt-4 text-xl font-semibold">{feature.title}</h3>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </section>

        <section id="recruit" className="rounded-[32px] bg-slate-900 px-6 py-10 text-white shadow-xl">
          <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-300">Recruiting Calendar</p>
            <h2 className="mt-3 text-3xl font-semibold">알바 모집 일정</h2>
            <p className="mt-2 text-sm text-slate-200">달력을 클릭하면 근무 상세 정보를 확인할 수 있습니다.</p>
          </div>
          <div className="mt-10 rounded-3xl bg-white p-6 shadow-inner">
            {error && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}
            {isLoading ? (
              <div className="flex h-96 items-center justify-center">
                <span className="material-icons animate-spin text-rose-400 text-5xl">refresh</span>
              </div>
            ) : (
              <ScheduleCalendarWidget
                schedules={availableSchedules}
                title=""
                subtitle=""
                onScheduleClick={(schedule) => navigate(`/schedule/${schedule.id}`)}
                disableDetailModal
              />
            )}
          </div>
        </section>

        <section className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Post FNB에 대해</h2>
            <p className="mt-4 text-sm leading-relaxed text-gray-600">
              Post FNB는 정성 가득한 화로구이 다이닝을 추구하며, 고객의 소중한 시간을 책임집니다. 우리 팀은 최고의 음식과 서비스를 제공하기 위해
              끊임없이 연구하고, 새로운 메뉴와 경험을 만들어 갑니다.
            </p>
            <div className="mt-6 space-y-3">
              <div className="flex items-start gap-3">
                <span className="material-icons text-rose-500">workspace_premium</span>
                <div>
                  <p className="font-semibold text-gray-900">수준 높은 교육 프로그램</p>
                  <p className="text-sm text-gray-600">신규 직원도 빠르게 적응할 수 있도록 맞춤형 교육 커리큘럼을 제공합니다.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="material-icons text-rose-500">sentiment_satisfied_alt</span>
                <div>
                  <p className="font-semibold text-gray-900">안정적인 근무 문화</p>
                  <p className="text-sm text-gray-600">서로 존중하고 배려하는 문화를 바탕으로 모두가 즐겁게 일할 수 있는 환경을 조성합니다.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">채용 문의</h3>
            <p className="mt-2 text-sm text-gray-600">관심 있는 분들은 아래 채널을 통해 문의해 주세요.</p>
            <div className="mt-4 space-y-3 text-sm text-gray-700">
              <p>📞 대표번호: 02-1234-5678</p>
              <p>✉️ 이메일: recruit@postfnb.co.kr</p>
              <p>📍 본사: 서울특별시 강남구 테헤란로 123, 18층</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="mt-6 w-full rounded-full bg-rose-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-400"
            >
              온라인 지원하기
            </button>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 bg-gray-50 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 text-center text-sm text-gray-500 sm:flex-row sm:justify-between">
          <p className="font-semibold text-gray-700">© {new Date().getFullYear()} POST FNB. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-gray-500 transition hover:text-gray-900"
            >
              직원 로그인
            </button>
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="text-gray-500 transition hover:text-gray-900"
            >
              회원 가입
            </button>
            <button
              type="button"
              onClick={() => window.open('https://www.instagram.com/explore/tags/%ED%99%94%EB%A1%9C%EA%B5%AC%EC%9D%B4/', '_blank', 'noopener')}
              className="text-gray-500 transition hover:text-gray-900"
            >
              인스타그램
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomeLanding;
