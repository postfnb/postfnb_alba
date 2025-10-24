# PostFNB Alba - 프론트엔드

아르바이트 관리 시스템의 React 기반 프론트엔드 애플리케이션입니다.

## 기술 스택

- **React 18** - UI 프레임워크
- **TypeScript** - 타입 안전성
- **Vite** - 빌드 도구
- **TailwindCSS** - 스타일링
- **Zustand** - 상태 관리
- **React Router** - 라우팅
- **Axios** - HTTP 클라이언트
- **Material Icons** - 아이콘

## 시작하기

### 1. 패키지 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.example`을 복사하여 `.env` 파일을 생성합니다:

```bash
cp .env.example .env
```

`.env` 파일을 편집하여 백엔드 API URL을 설정합니다:

```env
VITE_API_URL=http://localhost:3000
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:5173 을 열어 확인합니다.

## 프로젝트 구조

```
client/
├── public/              # 정적 파일
├── src/
│   ├── components/      # 재사용 가능한 컴포넌트
│   │   └── ProtectedRoute.tsx
│   ├── pages/           # 페이지 컴포넌트
│   │   └── auth/
│   │       ├── Login.tsx
│   │       ├── Register.tsx
│   │       └── AuthCallback.tsx
│   ├── services/        # API 서비스
│   │   └── auth.ts
│   ├── store/           # Zustand 상태 관리
│   │   └── authStore.ts
│   ├── utils/           # 유틸리티 함수
│   │   └── axios.ts
│   ├── App.tsx          # 메인 앱 컴포넌트
│   ├── main.tsx         # 진입점
│   └── index.css        # 글로벌 스타일
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 주요 기능

### 인증 시스템

- **로컬 로그인**: 이메일/비밀번호
- **소셜 로그인**: 카카오 OAuth2
- **자동 토큰 갱신**: Axios 인터셉터
- **보호된 라우트**: 인증 필요 페이지 보호
- **역할 기반 권한**: ADMIN, MANAGER, EMPLOYEE

### Axios 인터셉터

- Access Token 자동 추가
- 401 에러 시 Refresh Token으로 자동 갱신
- 토큰 만료 시 자동 로그인 페이지 이동

### 상태 관리 (Zustand)

```typescript
const { user, login, logout, isAuthenticated } = useAuthStore();
```

## 빌드

프로덕션 빌드:

```bash
npm run build
```

빌드된 파일은 `dist/` 디렉토리에 생성됩니다.

## 배포

빌드된 파일을 정적 호스팅 서비스에 배포:

- Vercel
- Netlify
- AWS S3 + CloudFront
- GitHub Pages

## 환경별 설정

### 개발 환경

```env
VITE_API_URL=http://localhost:3000
```

### 프로덕션 환경

```env
VITE_API_URL=https://api.yourdomain.com
```

## 라이센스

MIT
