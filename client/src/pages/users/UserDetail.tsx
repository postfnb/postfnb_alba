import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { userService, UserDetail as UserDetailType } from '../../services/users';
import { useAuthStore } from '../../store/authStore';

const UserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [userDetail, setUserDetail] = useState<UserDetailType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    role: '',
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    if (id) {
      loadUserDetail();
    }
  }, [id]);

  const loadUserDetail = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      const data = await userService.getUser(id);
      setUserDetail(data);
      setEditForm({
        name: data.name,
        phone: data.phone,
        role: data.role,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || '회원 정보를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (userDetail) {
      setEditForm({
        name: userDetail.name,
        phone: userDetail.phone,
        role: userDetail.role,
      });
    }
  };

  const handleSave = async () => {
    if (!id || !userDetail) return;

    try {
      // 변경된 정보만 전송
      const updateData: { name?: string; phone?: string; role?: string } = {};
      
      if (editForm.name !== userDetail.name) {
        updateData.name = editForm.name;
      }
      if (editForm.phone !== userDetail.phone) {
        updateData.phone = editForm.phone;
      }
      if (editForm.role !== userDetail.role) {
        updateData.role = editForm.role;
      }

      // 변경사항이 있는 경우에만 API 호출
      if (Object.keys(updateData).length > 0) {
        await userService.updateUser(id, updateData);
        alert('회원 정보가 수정되었습니다.');
      } else {
        alert('변경된 정보가 없습니다.');
      }
      
      setIsEditing(false);
      loadUserDetail();
    } catch (err: any) {
      alert(err.response?.data?.message || '회원 정보 수정에 실패했습니다.');
    }
  };

  const handleBlock = async () => {
    if (!id || !userDetail) return;
    
    if (!window.confirm(`${userDetail.name} 회원의 로그인을 차단하시겠습니까?\n차단 시 해당 회원은 로그인할 수 없습니다.`)) {
      return;
    }

    try {
      await userService.blockUser(id);
      alert('회원이 차단되었습니다.');
      loadUserDetail();
    } catch (err: any) {
      alert(err.response?.data?.message || '회원 차단에 실패했습니다.');
    }
  };

  const handleUnblock = async () => {
    if (!id || !userDetail) return;
    
    if (!window.confirm(`${userDetail.name} 회원의 로그인 차단을 해제하시겠습니까?`)) {
      return;
    }

    try {
      await userService.unblockUser(id);
      alert('회원 차단이 해제되었습니다.');
      loadUserDetail();
    } catch (err: any) {
      alert(err.response?.data?.message || '회원 차단 해제에 실패했습니다.');
    }
  };

  const handleDelete = async () => {
    if (!id || !userDetail) return;
    
    if (!window.confirm(`${userDetail.name} 회원을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    const confirmText = window.prompt('삭제를 확인하려면 "삭제"를 입력하세요:');
    if (confirmText !== '삭제') {
      alert('삭제가 취소되었습니다.');
      return;
    }

    try {
      await userService.deleteUser(id);
      alert('회원이 삭제되었습니다.');
      navigate('/users');
    } catch (err: any) {
      alert(err.response?.data?.message || '회원 삭제에 실패했습니다.');
    }
  };

  const handleOpenPasswordModal = () => {
    console.log('패스워드 변경 모달 열기');
    console.log('현재 userDetail:', userDetail);
    setShowPasswordModal(true);
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleChangePassword = async () => {
    if (!id || !userDetail) return;

    if (!newPassword) {
      alert('새 패스워드를 입력하세요.');
      return;
    }

    if (newPassword.length < 6) {
      alert('패스워드는 최소 6자 이상이어야 합니다.');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('패스워드가 일치하지 않습니다.');
      return;
    }

    if (!window.confirm(`${userDetail.name} 회원의 패스워드를 변경하시겠습니까?\n변경 후 해당 회원은 새 패스워드로 다시 로그인해야 합니다.`)) {
      return;
    }

    try {
      const result = await userService.changePassword(id, newPassword);
      alert(result.message);
      handleClosePasswordModal();
    } catch (err: any) {
      alert(err.response?.data?.message || '패스워드 변경에 실패했습니다.');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      PENDING: <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">대기중</span>,
      APPROVED: <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">승인됨</span>,
      REJECTED: <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">거부됨</span>,
      CANCELLED: <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">취소됨</span>,
    };
    return badges[status as keyof typeof badges] || status;
  };

  const getRoleBadge = (role: string) => {
    const badges = {
      ADMIN: <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full">관리자</span>,
      MANAGER: <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">매니저</span>,
      EMPLOYEE: <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">직원</span>,
    };
    return badges[role as keyof typeof badges] || role;
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

  const getApplicationStats = () => {
    if (!userDetail?.applications) return { total: 0, pending: 0, approved: 0, rejected: 0 };
    
    return {
      total: userDetail.applications.length,
      pending: userDetail.applications.filter(a => a.status === 'PENDING').length,
      approved: userDetail.applications.filter(a => a.status === 'APPROVED').length,
      rejected: userDetail.applications.filter(a => a.status === 'REJECTED').length,
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="material-icons text-indigo-600 text-6xl animate-spin">refresh</span>
      </div>
    );
  }

  if (error || !userDetail) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="material-icons text-red-600 text-6xl">error</span>
          <p className="mt-4 text-gray-600">{error || '회원 정보를 찾을 수 없습니다.'}</p>
          <button
            onClick={() => navigate('/users')}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const stats = getApplicationStats();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 네비게이션 */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/users')}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <span className="material-icons">arrow_back</span>
              </button>
              <span className="material-icons text-indigo-600">person</span>
              <span className="text-xl font-bold text-gray-900">회원 상세 정보</span>
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
        {/* 회원 기본 정보 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              {userDetail.profileImage ? (
                <img
                  src={userDetail.profileImage}
                  alt={userDetail.name}
                  className="w-20 h-20 rounded-full"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="material-icons text-indigo-600 text-4xl">person</span>
                </div>
              )}
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-2xl font-bold text-gray-900">{userDetail.name}</h2>
                  {!userDetail.isActive && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">차단됨</span>
                  )}
                </div>
                <p className="text-gray-600">{userDetail.email}</p>
                <div className="mt-2">
                  {getRoleBadge(userDetail.role)}
                </div>
              </div>
            </div>
            
            {/* 관리 버튼 (ADMIN만) */}
            {user?.role === 'ADMIN' && !isEditing && (
              <div className="flex space-x-2">
                <button
                  onClick={handleEdit}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
                >
                  <span className="material-icons text-sm mr-1">edit</span>
                  수정
                </button>
                
                {userDetail.provider === 'LOCAL' && (
                  <button
                    onClick={handleOpenPasswordModal}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
                  >
                    <span className="material-icons text-sm mr-1">lock_reset</span>
                    패스워드
                  </button>
                )}
                
                {userDetail.isActive ? (
                  <button
                    onClick={handleBlock}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center"
                  >
                    <span className="material-icons text-sm mr-1">block</span>
                    차단
                  </button>
                ) : (
                  <button
                    onClick={handleUnblock}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                  >
                    <span className="material-icons text-sm mr-1">check_circle</span>
                    차단 해제
                  </button>
                )}
                
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
                >
                  <span className="material-icons text-sm mr-1">delete</span>
                  삭제
                </button>
              </div>
            )}
            
            {/* 저장/취소 버튼 */}
            {isEditing && (
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                >
                  <span className="material-icons text-sm mr-1">save</span>
                  저장
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center"
                >
                  <span className="material-icons text-sm mr-1">close</span>
                  취소
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 연락처 */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">연락처</h3>
              {isEditing ? (
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="010-0000-0000"
                />
              ) : (
                <p className="text-gray-900">{userDetail.phone}</p>
              )}
            </div>
            
            {/* 역할 */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">역할</h3>
              {isEditing ? (
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ADMIN">관리자</option>
                  <option value="MANAGER">매니저</option>
                  <option value="EMPLOYEE">직원</option>
                </select>
              ) : (
                <div>{getRoleBadge(userDetail.role)}</div>
              )}
            </div>
            
            {/* 가입 방법 */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">가입 방법</h3>
              <p className="text-gray-900">
                {userDetail.provider === 'LOCAL' ? '이메일' : 
                 userDetail.provider === 'KAKAO' ? '카카오' : '구글'}
              </p>
            </div>
            
            {/* 가입일 */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">가입일</h3>
              <p className="text-gray-900">
                {new Date(userDetail.createdAt).toLocaleString('ko-KR')}
              </p>
            </div>
          </div>
        </div>

        {/* 신청 통계 */}
        {userDetail.role === 'EMPLOYEE' && (
          <>
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

            {/* 신청 내역 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">신청 내역</h3>
              
              {userDetail.applications && userDetail.applications.length > 0 ? (
                <div className="space-y-4">
                  {userDetail.applications.map((application) => {
                    const estimatedPay = calculateEstimatedPay(
                      application.schedule.hourlyWage,
                      application.schedule.startTime,
                      application.schedule.endTime
                    );
                    const workHours = calculateWorkHours(
                      application.schedule.startTime,
                      application.schedule.endTime
                    );

                    return (
                      <div key={application.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {application.schedule.store.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {new Date(application.schedule.date).toLocaleDateString('ko-KR')}
                            </p>
                          </div>
                          {getStatusBadge(application.status)}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div className="flex items-center">
                            <span className="material-icons text-gray-400 text-sm mr-1">schedule</span>
                            <span>
                              {application.schedule.startTime} - {application.schedule.endTime}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="material-icons text-gray-400 text-sm mr-1">access_time</span>
                            <span>{workHours}시간</span>
                          </div>
                          <div className="flex items-center">
                            <span className="material-icons text-gray-400 text-sm mr-1">payments</span>
                            <span>{application.schedule.hourlyWage.toLocaleString()}원/시간</span>
                          </div>
                          <div className="flex items-center">
                            <span className="material-icons text-gray-400 text-sm mr-1">account_balance_wallet</span>
                            <span className="font-semibold text-indigo-600">
                              {estimatedPay.toLocaleString()}원
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-3 text-xs text-gray-500">
                          신청일: {new Date(application.createdAt).toLocaleString('ko-KR')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  신청 내역이 없습니다.
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* 패스워드 변경 모달 */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-900">패스워드 변경</h2>
              <button onClick={handleClosePasswordModal} className="text-gray-400 hover:text-gray-600">
                <span className="material-icons">close</span>
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-4">
                {userDetail?.name} 회원의 패스워드를 변경합니다.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    새 패스워드
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="최소 6자 이상"
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    패스워드 확인
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="패스워드 재입력"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleChangePassword();
                      }
                    }}
                  />
                </div>
              </div>

              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <span className="material-icons text-sm align-middle mr-1">warning</span>
                  패스워드 변경 후 해당 회원은 자동으로 로그아웃되며, 새 패스워드로 다시 로그인해야 합니다.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={handleClosePasswordModal}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                취소
              </button>
              <button
                onClick={handleChangePassword}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                변경
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDetail;
