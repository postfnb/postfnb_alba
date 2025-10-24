import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string[];
}

/**
 * 인증이 필요한 페이지를 보호하는 컴포넌트
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  console.log('[ProtectedRoute] 상태:', { isAuthenticated, hasUser: !!user, path: location.pathname });

  // 인증되지 않은 경우 로그인 페이지로 리다이렉트
  if (!isAuthenticated) {
    console.log('[ProtectedRoute] 인증되지 않음, 로그인 페이지로 리다이렉트');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 역할 기반 권한 체크
  if (requiredRole && user && !requiredRole.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <span className="material-icons text-red-600 text-5xl">block</span>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            접근 권한 없음
          </h2>
          <p className="mt-2 text-gray-600">
            이 페이지에 접근할 권한이 없습니다.
          </p>
          <button
            onClick={() => window.history.back()}
            className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
