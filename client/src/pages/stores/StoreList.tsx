import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storeService, Store } from '../../services/stores';
import { useAuthStore } from '../../store/authStore';

const StoreList: React.FC = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    description: '',
    baseHourlyWage: 9860,
  });

  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      setIsLoading(true);
      const data = await storeService.getStores();
      setStores(data);
    } catch (err: any) {
      setError(err.response?.data?.message || '업체 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await storeService.createStore(formData);
      setShowCreateModal(false);
      setFormData({
        name: '',
        address: '',
        phone: '',
        description: '',
        baseHourlyWage: 9860,
      });
      loadStores();
    } catch (err: any) {
      alert(err.response?.data?.message || '업체 생성에 실패했습니다.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`"${name}" 업체를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await storeService.deleteStore(id);
      loadStores();
    } catch (err: any) {
      alert(err.response?.data?.message || '업체 삭제에 실패했습니다.');
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
              <span className="material-icons text-indigo-600">store</span>
              <span className="text-xl font-bold text-gray-900">업체 관리</span>
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
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">업체 목록</h1>
            <p className="text-gray-600 mt-1">총 {stores.length}개의 업체</p>
          </div>
          {user?.role === 'ADMIN' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <span className="material-icons mr-2">add</span>
              업체 추가
            </button>
          )}
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {/* 업체 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((store) => (
            <div key={store.id} className="bg-white rounded-lg shadow hover:shadow-lg transition p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <span className="material-icons text-indigo-600 mr-2">store</span>
                  <h3 className="text-lg font-bold text-gray-900">{store.name}</h3>
                </div>
                {user?.role === 'ADMIN' && (
                  <button
                    onClick={() => handleDelete(store.id, store.name)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <span className="material-icons text-sm">delete</span>
                  </button>
                )}
              </div>

              <div className="space-y-2 text-sm">
                {store.address && (
                  <div className="flex items-start">
                    <span className="material-icons text-gray-400 text-sm mr-2">location_on</span>
                    <span className="text-gray-600">{store.address}</span>
                  </div>
                )}
                {store.phone && (
                  <div className="flex items-center">
                    <span className="material-icons text-gray-400 text-sm mr-2">phone</span>
                    <span className="text-gray-600">{store.phone}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <span className="material-icons text-gray-400 text-sm mr-2">payments</span>
                  <span className="text-gray-600">
                    기본 시급: {store.baseHourlyWage.toLocaleString()}원
                  </span>
                </div>
                {store._count && (
                  <div className="flex items-center">
                    <span className="material-icons text-gray-400 text-sm mr-2">event</span>
                    <span className="text-gray-600">일정: {store._count.schedules}개</span>
                  </div>
                )}
              </div>

              {store.managers && store.managers.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-gray-500 mb-2">관리자</p>
                  <div className="flex flex-wrap gap-2">
                    {store.managers.map((manager) => (
                      <span
                        key={manager.user.id}
                        className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full"
                      >
                        {manager.user.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t">
                <button
                  onClick={() => navigate(`/stores/${store.id}`)}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  상세보기
                </button>
              </div>
            </div>
          ))}
        </div>

        {stores.length === 0 && !error && (
          <div className="text-center py-12">
            <span className="material-icons text-gray-400 text-6xl">store</span>
            <p className="mt-4 text-gray-600">등록된 업체가 없습니다.</p>
          </div>
        )}
      </main>

      {/* 업체 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">새 업체 추가</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  업체명 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="PostFNB 강남점"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  주소
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="서울시 강남구..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  전화번호
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="02-1234-5678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  기본 시급 (원)
                </label>
                <input
                  type="number"
                  required
                  min="9860"
                  value={formData.baseHourlyWage}
                  onChange={(e) => setFormData({ ...formData, baseHourlyWage: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  placeholder="업체 설명..."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  추가
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreList;
