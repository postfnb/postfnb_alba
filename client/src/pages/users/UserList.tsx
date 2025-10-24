import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService, User } from '../../services/users';
import { useAuthStore } from '../../store/authStore';

const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    loadUsers();
  }, [selectedRole]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const data = await userService.getUsers(
        selectedRole ? { role: selectedRole } : {}
      );
      setUsers(data);
    } catch (err: any) {
      setError(err.response?.data?.message || '사용자 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const badges = {
      ADMIN: <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full">관리자</span>,
      MANAGER: <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">매니저</span>,
      EMPLOYEE: <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">직원</span>,
    };
    return badges[role as keyof typeof badges] || role;
  };

  const getProviderBadge = (provider: string) => {
    const badges = {
      LOCAL: <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">이메일</span>,
      KAKAO: <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">카카오</span>,
      GOOGLE: <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">구글</span>,
    };
    return badges[provider as keyof typeof badges] || provider;
  };

  const filteredUsers = users.filter(u => {
    if (!searchTerm) return true;
    return (
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone.includes(searchTerm)
    );
  });

  const getStats = () => {
    return {
      total: users.length,
      admin: users.filter(u => u.role === 'ADMIN').length,
      manager: users.filter(u => u.role === 'MANAGER').length,
      employee: users.filter(u => u.role === 'EMPLOYEE').length,
    };
  };

  const stats = getStats();

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
              <span className="material-icons text-indigo-600">people</span>
              <span className="text-xl font-bold text-gray-900">회원 관리</span>
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
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">전체 회원</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <span className="material-icons text-gray-400 text-3xl">people</span>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">관리자</p>
                <p className="text-2xl font-bold text-red-600">{stats.admin}</p>
              </div>
              <span className="material-icons text-red-400 text-3xl">admin_panel_settings</span>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">매니저</p>
                <p className="text-2xl font-bold text-blue-600">{stats.manager}</p>
              </div>
              <span className="material-icons text-blue-400 text-3xl">supervisor_account</span>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">직원</p>
                <p className="text-2xl font-bold text-green-600">{stats.employee}</p>
              </div>
              <span className="material-icons text-green-400 text-3xl">badge</span>
            </div>
          </div>
        </div>

        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">회원 목록</h1>
            <p className="text-gray-600 mt-1">{filteredUsers.length}명의 회원</p>
          </div>
        </div>

        {/* 필터 및 검색 */}
        <div className="mb-6 flex space-x-4">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">모든 역할</option>
            <option value="ADMIN">관리자</option>
            <option value="MANAGER">매니저</option>
            <option value="EMPLOYEE">직원</option>
          </select>

          <div className="flex-1 relative">
            <span className="material-icons absolute left-3 top-2.5 text-gray-400">search</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="이름, 이메일, 전화번호로 검색..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {/* 회원 목록 테이블 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  회원 정보
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  연락처
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  역할
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  가입 방법
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  가입일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {u.profileImage ? (
                        <img
                          src={u.profileImage}
                          alt={u.name}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="material-icons text-indigo-600">person</span>
                        </div>
                      )}
                      <div className="ml-4">
                        <div className="flex items-center space-x-2">
                          <div className="text-sm font-medium text-gray-900">{u.name}</div>
                          {!u.isActive && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">차단됨</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{u.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(u.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getProviderBadge(u.provider)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(u.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => navigate(`/users/${u.id}`)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      상세보기
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && !error && (
          <div className="text-center py-12">
            <span className="material-icons text-gray-400 text-6xl">people</span>
            <p className="mt-4 text-gray-600">회원이 없습니다.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default UserList;
