# 프론트엔드 구현 완료

## 📦 구현된 파일 목록

### 핵심 인증 파일
- ✅ `client/src/utils/axios.ts` - Axios 인터셉터 (자동 토큰 갱신)
- ✅ `client/src/services/auth.ts` - 인증 API 서비스
- ✅ `client/src/store/authStore.ts` - Zustand 상태 관리

### 페이지 컴포넌트
- ✅ `client/src/pages/auth/Login.tsx` - 로그인 페이지
- ✅ `client/src/pages/auth/Register.tsx` - 회원가입 페이지
- ✅ `client/src/pages/auth/AuthCallback.tsx` - OAuth2 콜백 페이지

### 유틸리티 컴포넌트
- ✅ `client/src/components/ProtectedRoute.tsx` - 인증 보호 라우트

### 설정 파일
- ✅ `client/src/App.tsx` - 메인 앱 & 라우터
- ✅ `client/src/main.tsx` - 진입점
- ✅ `client/package.json` - 의존성
- ✅ `client/vite.config.ts` - Vite 설정
- ✅ `client/tailwind.config.js` - TailwindCSS 설정
- ✅ `client/tsconfig.json` - TypeScript 설정

## 🚀 실행 방법

### 1. 패키지 설치
```bash
cd client
npm install
```

### 2. 환경 변수 설정
```bash
# .env 파일 생성
cp .env.example .env
```

`.env` 파일 내용:
```env
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=PostFNB Alba
```

### 3. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 http://localhost:5173 접속

## 🔑 주요 기능

### 1. Axios 인터셉터
```typescript
// 요청 시 자동으로 Access Token 추가
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 에러 시 Refresh Token으로 자동 갱신
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Refresh Token으로 새로운 Access Token 요청
      const { accessToken } = await refreshToken();
      // 원래 요청 재시도
      return api(originalRequest);
    }
  }
);
```

### 2. Zustand 상태 관리
```typescript
// 사용법
const { user, login, logout, isAuthenticated } = useAuthStore();

// 로그인
await login('email@example.com', 'password');

// 로그아웃
await logout();

// 사용자 정보 로드
await loadUser();
```

### 3. 보호된 라우트
```typescript
// 인증 필요
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />

// 역할 기반 권한
<Route path="/admin" element={
  <ProtectedRoute requiredRole={['ADMIN']}>
    <AdminPage />
  </ProtectedRoute>
} />
```

### 4. 소셜 로그인
```typescript
// 카카오 로그인
const handleKakaoLogin = () => {
  window.location.href = authService.getKakaoLoginUrl();
};

// 콜백 처리 (AuthCallback.tsx)
// URL에서 token 파라미터 추출 후 로그인 처리
```

## 📱 UI 디자인

### 색상 테마
- **Primary**: Indigo (#4f46e5)
- **카카오**: Yellow (#FEE500)
- **성공**: Green
- **에러**: Red

### Material Icons 사용
```tsx
<span className="material-icons">login</span>
<span className="material-icons">email</span>
<span className="material-icons">lock</span>
```

### TailwindCSS 유틸리티
- 반응형: `md:`, `lg:` prefix
- 호버: `hover:bg-indigo-700`
- 포커스: `focus:ring-2`
- 전환: `transition`

## 🔐 보안 사항

1. **Access Token**: localStorage 저장 (15분 유효)
2. **Refresh Token**: HttpOnly 쿠키 (7일 유효)
3. **자동 갱신**: 401 에러 시 자동으로 Refresh Token 사용
4. **XSS 방지**: Refresh Token은 JavaScript 접근 불가
5. **CSRF 방지**: withCredentials 설정

## 📝 API 엔드포인트

### 인증 API
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/auth/kakao` - 카카오 로그인 시작
- `GET /api/auth/kakao/callback` - 카카오 콜백
- `POST /api/auth/refresh` - 토큰 갱신
- `POST /api/auth/logout` - 로그아웃
- `GET /api/auth/me` - 사용자 정보

## 🎨 페이지 미리보기

### 로그인 페이지
- 이메일/비밀번호 입력
- 카카오 로그인 버튼
- 회원가입 링크
- 비밀번호 찾기

### 회원가입 페이지
- 이름, 이메일, 비밀번호 입력
- 폼 유효성 검사
- 실시간 에러 표시
- 약관 동의 체크박스

### 대시보드
- 사용자 정보 표시
- 역할, 이메일, 로그인 방식
- 로그아웃 버튼

## 🛠️ 다음 단계

### 백엔드 연동 필요
1. 백엔드 서버 구현 (Express + Passport)
2. PostgreSQL + Prisma 설정
3. JWT 발급 로직
4. 카카오 OAuth2 설정

### 추가 기능 구현
1. 비밀번호 찾기/재설정
2. 프로필 수정
3. 이메일 인증
4. 2FA (이중 인증)

### UI/UX 개선
1. 로딩 스켈레톤
2. 토스트 알림
3. 폼 애니메이션
4. 다크 모드

## ⚠️ 주의사항

1. `.env` 파일은 절대 Git에 커밋하지 마세요
2. 프로덕션에서는 HTTPS 필수
3. CORS 설정 확인 필요
4. Rate Limiting 설정 권장

## 📚 참고 문서

- [React 공식 문서](https://react.dev)
- [Zustand 공식 문서](https://zustand-demo.pmnd.rs)
- [TailwindCSS 공식 문서](https://tailwindcss.com)
- [Axios 공식 문서](https://axios-http.com)
- [React Router 공식 문서](https://reactrouter.com)
