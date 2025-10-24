# 프로젝트 구조 설계 및 기술 스택 선정

## 1. 프로젝트 개요
- **프로젝트명**: PostFNB Alba (아르바이트 관리 시스템)
- **목적**: 아르바이트생 근무 관리 및 급여 계산
- **타겟**: 소규모 F&B 업체

## 2. 기술 스택 선정

### 프론트엔드
```
프레임워크: React 18+ (또는 Next.js 14+ for SSR)
  - 이유: 풍부한 생태계, 컴포넌트 재사용성, 빠른 개발 속도
  
스타일링: TailwindCSS 3+
  - 이유: 빠른 UI 개발, 일관된 디자인 시스템, 커스터마이징 용이
  
UI 컴포넌트: shadcn/ui
  - 이유: 접근성 좋은 컴포넌트, Radix UI 기반, 커스터마이징 가능
  
아이콘: Material Icons
  - 이유: 다양한 아이콘, 무료, 직관적인 디자인
  
상태 관리: Zustand (또는 Redux Toolkit)
  - 이유: 간단한 API, TypeScript 지원, 보일러플레이트 최소화
  
폼 관리: React Hook Form + Zod
  - 이유: 성능 최적화, 타입 안전성, 유효성 검사 통합
```

### 백엔드
```
런타임: Node.js 20+ 
프레임워크: Express.js (또는 Fastify)
  - 이유: 안정성, 미들웨어 생태계, 학습 곡선 낮음
  
언어: TypeScript
  - 이유: 타입 안전성, IDE 지원, 유지보수성 향상
  
인증: OAuth2 + JWT + Passport.js
  - 이유: 소셜 로그인 지원 (카카오 연동 고려), Stateless 인증, 확장성 좋음
  - 전략: Local (이메일/비밀번호) + OAuth2 (카카오, 구글 등)
  - 비밀번호 암호화: bcrypt
  
API 문서: Swagger/OpenAPI
  - 이유: 자동 문서화, API 테스트 용이
```

### 데이터베이스
```
주 DB: PostgreSQL 15+
  - 이유: 관계형 데이터 지원, ACID 보장, 안정성
  
ORM: Prisma
  - 이유: 타입 안전성, 마이그레이션 관리, 직관적인 쿼리 API
  
캐시: Redis (선택사항)
  - 이유: 세션 관리, API 응답 캐싱, 성능 향상
```

### 개발 도구
```
패키지 관리: pnpm (또는 npm)
버전 관리: Git + GitHub
코드 품질: ESLint + Prettier
테스트: Jest + React Testing Library
E2E 테스트: Playwright (선택사항)
```

## 3. 프로젝트 디렉토리 구조

```
postfnb_alba/
├── client/                      # 프론트엔드
│   ├── public/
│   │   └── assets/
│   ├── src/
│   │   ├── components/          # 재사용 가능한 컴포넌트
│   │   │   ├── ui/              # shadcn/ui 컴포넌트
│   │   │   ├── forms/           # 폼 관련 컴포넌트
│   │   │   └── layout/          # 레이아웃 컴포넌트
│   │   ├── pages/               # 페이지 컴포넌트
│   │   │   ├── auth/            # 로그인, 회원가입
│   │   │   ├── dashboard/       # 대시보드
│   │   │   ├── schedule/        # 근무 스케줄
│   │   │   └── payroll/         # 급여 관리
│   │   ├── hooks/               # 커스텀 훅
│   │   ├── services/            # API 호출 로직
│   │   ├── store/               # 상태 관리
│   │   ├── utils/               # 유틸리티 함수
│   │   ├── types/               # TypeScript 타입 정의
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── server/                      # 백엔드
│   ├── src/
│   │   ├── controllers/         # 요청 처리 로직
│   │   │   └── auth/            # 인증 컨트롤러
│   │   ├── services/            # 비즈니스 로직
│   │   │   └── auth/            # 인증 서비스
│   │   ├── models/              # 데이터 모델
│   │   ├── routes/              # API 라우트
│   │   │   └── auth/            # 인증 라우트
│   │   ├── middleware/          # 미들웨어 (인증, 로깅 등)
│   │   │   ├── auth.ts          # JWT 검증 미들웨어
│   │   │   └── rateLimiter.ts   # Rate limiting
│   │   ├── config/              # 설정 파일
│   │   │   ├── passport.ts      # Passport 전략 설정
│   │   │   └── oauth.ts         # OAuth2 설정
│   │   ├── utils/               # 유틸리티 함수
│   │   │   ├── jwt.ts           # JWT 생성/검증
│   │   │   └── token.ts         # 토큰 관리
│   │   ├── types/               # TypeScript 타입 정의
│   │   └── index.ts             # 서버 엔트리 포인트
│   ├── prisma/
│   │   ├── schema.prisma        # DB 스키마
│   │   └── migrations/          # DB 마이그레이션
│   ├── tests/                   # 테스트 파일
│   ├── package.json
│   └── tsconfig.json
│
├── shared/                      # 공유 코드 (선택사항)
│   ├── types/                   # 클라이언트-서버 공유 타입
│   └── constants/               # 공통 상수
│
├── docs/                        # 문서
│   ├── API.md                   # API 문서
│   ├── SETUP.md                 # 설치 가이드
│   └── ARCHITECTURE.md          # 아키텍처 문서
│
├── .gitignore
├── .env.example
├── README.md
└── docker-compose.yml           # 개발 환경 설정
```

## 4. 주요 기능별 기술 선택

### 근무 스케줄 관리
- **캘린더 UI**: react-big-calendar 또는 FullCalendar
- **날짜 처리**: date-fns 또는 dayjs

### 급여 계산
- **숫자 계산**: decimal.js (정확한 금액 계산)
- **엑셀 내보내기**: xlsx 또는 exceljs

### 인증 & 권한
- **인증 라이브러리**: Passport.js
- **OAuth2 제공자**:
  - 카카오 로그인: passport-kakao
  - 구글 로그인: passport-google-oauth20 (선택사항)
- **JWT 관리**: jsonwebtoken
- **토큰 전략**:
  - Access Token (15분): API 요청 인증
  - Refresh Token (7일): Access Token 갱신
- **보안**: helmet, express-rate-limit

### 알림 기능
- **실시간 통신**: Socket.io (선택사항)
- **이메일**: Nodemailer
- **푸시 알림**: Firebase Cloud Messaging (선택사항)

### 파일 업로드
- **클라이언트**: react-dropzone
- **서버**: multer
- **저장소**: AWS S3 또는 로컬 스토리지

## 5. 개발 환경 설정 순서

1. **Git 저장소 초기화**
   ```bash
   git init
   git remote add origin <repository-url>
   ```

2. **프론트엔드 설정**
   ```bash
   npm create vite@latest client -- --template react-ts
   cd client
   npm install
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```

3. **백엔드 설정**
   ```bash
   mkdir server && cd server
   npm init -y
   npm install express cors dotenv
   npm install -D typescript @types/node @types/express ts-node nodemon
   npx tsc --init
   ```

3-1. **인증 관련 패키지 설치**
   ```bash
   # JWT 및 OAuth2
   npm install passport passport-jwt passport-local passport-kakao jsonwebtoken bcrypt
   npm install -D @types/passport @types/passport-jwt @types/passport-local @types/jsonwebtoken @types/bcrypt
   
   # 보안
   npm install helmet express-rate-limit
   npm install -D @types/express-rate-limit
   ```

4. **데이터베이스 설정**
   ```bash
   npm install prisma @prisma/client
   npx prisma init
   ```

5. **개발 도구 설정**
   ```bash
   npm install -D eslint prettier eslint-config-prettier
   npx eslint --init
   ```

## 6. 환경 변수 예시

### 클라이언트 (.env)
```env
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=PostFNB Alba
```

### 서버 (.env)
```env
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/postfnb_alba
REDIS_URL=redis://localhost:6379

# JWT Tokens
JWT_ACCESS_SECRET=your-access-token-secret-key
JWT_REFRESH_SECRET=your-refresh-token-secret-key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# OAuth2 - Kakao Login
KAKAO_CLIENT_ID=your-kakao-rest-api-key
KAKAO_CLIENT_SECRET=your-kakao-client-secret
KAKAO_CALLBACK_URL=http://localhost:3000/api/auth/kakao/callback

# OAuth2 - Google Login (선택사항)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Client URL (CORS)
CLIENT_URL=http://localhost:5173

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password
```

## 7. 다음 단계

✅ **완료**: 기술 스택 선정  
🔄 **진행 중**: 프로젝트 구조 설계  
⏳ **대기**: 개발 환경 설정  
⏳ **대기**: 코어 기능 개발 시작

---

**참고**: 프로젝트 규모와 요구사항에 따라 기술 스택을 조정할 수 있습니다.
예를 들어, 간단한 프로젝트라면 Redux 대신 Context API를, PostgreSQL 대신 SQLite를 선택할 수 있습니다.
