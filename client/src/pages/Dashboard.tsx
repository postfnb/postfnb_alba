import React from 'react';
import { useAuthStore } from '../store/authStore';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 네비게이션 바 */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <span className="material-icons text-indigo-600 mr-2">work</span>
              <span className="text-xl font-bold text-gray-900">PostFNB Alba</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                {user?.profileImage ? (
                  <img 
                    src={user.profileImage} 
                    alt={user.name} 
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <span className="material-icons text-gray-600">account_circle</span>
                )}
                <span className="ml-2 text-gray-700">{user?.name}</span>
                <span className="ml-2 px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
                  {user?.role}
                </span>
              </div>
              <button
                onClick={logout}
                className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
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
        {/* 환영 메시지 */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-8 mb-8 text-white">
          <h1 className="text-3xl font-bold mb-2">
            환영합니다, {user?.name}님! 👋
          </h1>
          <p className="text-indigo-100">
            오늘도 좋은 하루 되세요!
          </p>
        </div>

        {/* 사용자 정보 카드 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="material-icons mr-2 text-indigo-600">person</span>
            내 정보
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">이름</p>
                  <p className="text-base font-semibold text-gray-900">
                    {user?.name || '없음'}
                  </p>
                </div>
                <span className="material-icons text-blue-600">person</span>
              </div>
            </div>

            <div className="bg-indigo-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">이메일</p>
                  <p className="text-base font-semibold text-gray-900 break-all">
                    {user?.email || '없음'}
                  </p>
                </div>
                <span className="material-icons text-indigo-600">email</span>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">전화번호</p>
                  <p className="text-base font-semibold text-gray-900">
                    {user?.phone || '없음'}
                  </p>
                </div>
                <span className="material-icons text-green-600">phone</span>
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">역할</p>
                  <p className="text-base font-semibold text-gray-900">
                    {user?.role === 'ADMIN' ? '관리자' : 
                     user?.role === 'MANAGER' ? '매니저' : '직원'}
                  </p>
                </div>
                <span className="material-icons text-purple-600">badge</span>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">로그인 방식</p>
                  <p className="text-base font-semibold text-gray-900">
                    {user?.provider === 'KAKAO' ? '카카오' : 
                     user?.provider === 'GOOGLE' ? '구글' : '이메일'}
                  </p>
                </div>
                <span className="material-icons text-yellow-600">login</span>
              </div>
            </div>
          </div>
        </div>

        {/* 관리자 전용 메뉴 */}
        {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="material-icons mr-2 text-indigo-600">admin_panel_settings</span>
              관리자 메뉴
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <a
                href="/stores"
                className="flex items-center justify-center p-6 border-2 border-indigo-200 bg-indigo-50 rounded-lg hover:border-indigo-500 hover:bg-indigo-100 transition group"
              >
                <span className="material-icons text-indigo-600 mr-3 text-3xl">
                  store
                </span>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">업체 관리</p>
                  <p className="text-sm text-gray-500">업체 등록 및 관리</p>
                </div>
              </a>
              
              <a
                href="/schedules"
                className="flex items-center justify-center p-6 border-2 border-green-200 bg-green-50 rounded-lg hover:border-green-500 hover:bg-green-100 transition group"
              >
                <span className="material-icons text-green-600 mr-3 text-3xl">
                  calendar_month
                </span>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">일정 관리</p>
                  <p className="text-sm text-gray-500">근무 일정 생성</p>
                </div>
              </a>
              
              <a
                href="/applications"
                className="flex items-center justify-center p-6 border-2 border-purple-200 bg-purple-50 rounded-lg hover:border-purple-500 hover:bg-purple-100 transition group"
              >
                <span className="material-icons text-purple-600 mr-3 text-3xl">
                  assignment
                </span>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">신청 관리</p>
                  <p className="text-sm text-gray-500">알바 신청 승인</p>
                </div>
              </a>
              
              <a
                href="/users"
                className="flex items-center justify-center p-6 border-2 border-orange-200 bg-orange-50 rounded-lg hover:border-orange-500 hover:bg-orange-100 transition group"
              >
                <span className="material-icons text-orange-600 mr-3 text-3xl">
                  people
                </span>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">회원 관리</p>
                  <p className="text-sm text-gray-500">회원 정보 조회</p>
                </div>
              </a>
            </div>
          </div>
        )}

        {/* 직원 전용 메뉴 */}
        {user?.role === 'EMPLOYEE' && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="material-icons mr-2 text-indigo-600">work</span>
              알바 메뉴
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href="/available-schedules"
                className="flex items-center justify-center p-6 border-2 border-indigo-200 bg-indigo-50 rounded-lg hover:border-indigo-500 hover:bg-indigo-100 transition group"
              >
                <span className="material-icons text-indigo-600 mr-3 text-3xl">
                  search
                </span>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">알바 찾기</p>
                  <p className="text-sm text-gray-500">신청 가능한 일정 보기</p>
                </div>
              </a>
              
              <a
                href="/my-applications"
                className="flex items-center justify-center p-6 border-2 border-green-200 bg-green-50 rounded-lg hover:border-green-500 hover:bg-green-100 transition group"
              >
                <span className="material-icons text-green-600 mr-3 text-3xl">
                  assignment
                </span>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">내 신청 내역</p>
                  <p className="text-sm text-gray-500">신청 및 승인 현황</p>
                </div>
              </a>
            </div>
          </div>
        )}

        {/* 빠른 액션 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="material-icons mr-2 text-indigo-600">flash_on</span>
            빠른 액션
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/schedule-calendar"
              className="flex items-center justify-center p-6 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition group"
            >
              <span className="material-icons text-gray-400 group-hover:text-indigo-600 mr-3 text-3xl">
                calendar_today
              </span>
              <div className="text-left">
                <p className="font-semibold text-gray-900">근무 달력</p>
                <p className="text-sm text-gray-500">월별 일정 보기</p>
              </div>
            </a>
            
            <button className="flex items-center justify-center p-6 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition group">
              <span className="material-icons text-gray-400 group-hover:text-green-600 mr-3 text-3xl">
                payments
              </span>
              <div className="text-left">
                <p className="font-semibold text-gray-900">급여 내역</p>
                <p className="text-sm text-gray-500">급여 조회</p>
              </div>
            </button>
            
            <button className="flex items-center justify-center p-6 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition group">
              <span className="material-icons text-gray-400 group-hover:text-purple-600 mr-3 text-3xl">
                settings
              </span>
              <div className="text-left">
                <p className="font-semibold text-gray-900">설정</p>
                <p className="text-sm text-gray-500">계정 설정</p>
              </div>
            </button>
          </div>
        </div>

        {/* 최근 활동 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="material-icons mr-2 text-indigo-600">history</span>
            최근 활동
          </h2>
          <div className="space-y-4">
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <span className="material-icons text-indigo-600 mr-4">login</span>
              <div className="flex-1">
                <p className="font-medium text-gray-900">로그인</p>
                <p className="text-sm text-gray-500">
                  {user?.lastLoginAt 
                    ? new Date(user.lastLoginAt).toLocaleString('ko-KR')
                    : '정보 없음'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <span className="material-icons text-green-600 mr-4">check_circle</span>
              <div className="flex-1">
                <p className="font-medium text-gray-900">계정 생성</p>
                <p className="text-sm text-gray-500">
                  {user?.createdAt 
                    ? new Date(user.createdAt).toLocaleString('ko-KR')
                    : '정보 없음'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
