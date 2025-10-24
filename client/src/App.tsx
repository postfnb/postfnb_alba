import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { ProtectedRoute } from './components/ProtectedRoute';

// 페이지 import
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AuthCallback from './pages/auth/AuthCallback';
import Dashboard from './pages/Dashboard';
import StoreList from './pages/stores/StoreList';
import ScheduleList from './pages/schedules/ScheduleList';
import ScheduleCalendar from './pages/schedules/ScheduleCalendar';
import ApplicationList from './pages/applications/ApplicationList';
import AvailableSchedules from './pages/employee/AvailableSchedules';
import MyApplications from './pages/employee/MyApplications';
import UserList from './pages/users/UserList';
import UserDetail from './pages/users/UserDetail';
import HomeLanding from './pages/public/HomeLanding';
import ScheduleDetail from './pages/public/ScheduleDetail';

function App() {
  const { loadUser } = useAuthStore();

  // 앱 시작 시 토큰이 있으면 사용자 정보 로드
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      console.log('[App] 토큰 발견, 사용자 정보 로드');
      loadUser();
    }
  }, [loadUser]);

  return (
    <BrowserRouter>
      <Routes>
        {/* 공개 라우트 */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/index" element={<HomeLanding />} />
        <Route path="/schedule/:id" element={<ScheduleDetail />} />

        {/* 보호된 라우트 */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* 업체 관리 */}
        <Route
          path="/stores"
          element={
            <ProtectedRoute>
              <StoreList />
            </ProtectedRoute>
          }
        />

        {/* 일정 관리 */}
        <Route
          path="/schedules"
          element={
            <ProtectedRoute>
              <ScheduleList />
            </ProtectedRoute>
          }
        />

        {/* 일정 달력 */}
        <Route
          path="/schedule-calendar"
          element={
            <ProtectedRoute>
              <ScheduleCalendar />
            </ProtectedRoute>
          }
        />

        {/* 신청 관리 */}
        <Route
          path="/applications"
          element={
            <ProtectedRoute>
              <ApplicationList />
            </ProtectedRoute>
          }
        />

        {/* 직원용 - 알바 찾기 */}
        <Route
          path="/available-schedules"
          element={
            <ProtectedRoute>
              <AvailableSchedules />
            </ProtectedRoute>
          }
        />

        {/* 직원용 - 내 신청 내역 */}
        <Route
          path="/my-applications"
          element={
            <ProtectedRoute>
              <MyApplications />
            </ProtectedRoute>
          }
        />

        {/* 회원 관리 */}
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <UserList />
            </ProtectedRoute>
          }
        />

        {/* 회원 상세 */}
        <Route
          path="/users/:id"
          element={
            <ProtectedRoute>
              <UserDetail />
            </ProtectedRoute>
          }
        />

        {/* 관리자 전용 라우트 예시 */}
        {/* <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole={['ADMIN']}>
              <AdminPage />
            </ProtectedRoute>
          }
        /> */}

        {/* 기본 라우트 */}
        <Route path="/" element={<Navigate to="/index" replace />} />
        
        {/* 404 페이지 */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <span className="material-icons text-gray-400 text-6xl">error_outline</span>
                <h1 className="mt-4 text-3xl font-bold text-gray-900">404</h1>
                <p className="mt-2 text-gray-600">페이지를 찾을 수 없습니다.</p>
                <a
                  href="/dashboard"
                  className="mt-6 inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  홈으로 이동
                </a>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
