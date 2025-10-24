import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/auth';

/**
 * OAuth2 소셜 로그인 콜백 페이지
 * 카카오, 구글 등에서 리다이렉트된 후 처리
 */
export const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth, setError } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const processCallback = async () => {
      try {
        // URL에서 토큰 가져오기
        const token = searchParams.get('token');
        const error = searchParams.get('error');

        if (error) {
          setError('소셜 로그인에 실패했습니다.');
          setStatus('error');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        if (!token) {
          setError('인증 토큰을 찾을 수 없습니다.');
          setStatus('error');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        // 토큰으로 사용자 정보 가져오기
        localStorage.setItem('accessToken', token);
        const user = await authService.getCurrentUser();

        // 인증 상태 업데이트
        setAuth(token, user);
        setStatus('success');

        // 대시보드로 이동
        setTimeout(() => navigate('/dashboard'), 1000);
      } catch (err) {
        console.error('OAuth 콜백 처리 오류:', err);
        setError('인증 처리 중 오류가 발생했습니다.');
        setStatus('error');
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    processCallback();
  }, [searchParams, navigate, setAuth, setError]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
        {status === 'loading' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
              <span className="material-icons text-indigo-600 text-3xl animate-spin">
                refresh
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              로그인 처리 중...
            </h2>
            <p className="text-gray-600">
              잠시만 기다려주세요.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <span className="material-icons text-green-600 text-3xl">
                check_circle
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              로그인 성공!
            </h2>
            <p className="text-gray-600">
              대시보드로 이동합니다...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <span className="material-icons text-red-600 text-3xl">
                error
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              로그인 실패
            </h2>
            <p className="text-gray-600 mb-4">
              로그인 페이지로 돌아갑니다...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
