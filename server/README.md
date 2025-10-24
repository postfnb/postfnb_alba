# PostFNB Alba - 백엔드

아르바이트 관리 시스템의 Node.js + Express + TypeScript 백엔드 서버입니다.

## 기술 스택

- **Node.js 20+** - 런타임
- **Express.js** - 웹 프레임워크
- **TypeScript** - 타입 안전성
- **Prisma** - ORM
- **PostgreSQL** - 데이터베이스
- **Passport.js** - 인증
- **JWT** - 토큰 기반 인증
- **bcrypt** - 비밀번호 암호화

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

`.env` 파일을 편집하여 필요한 값들을 설정합니다:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/postfnb_alba
JWT_ACCESS_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
KAKAO_CLIENT_ID=your-kakao-client-id
CLIENT_URL=http://localhost:5173
```

### 3. 데이터베이스 설정

PostgreSQL이 설치되어 있어야 합니다.

```bash
# Prisma 클라이언트 생성
npm run prisma:generate

# 데이터베이스 마이그레이션
npm run prisma:migrate

# Prisma Studio (DB GUI)
npm run prisma:studio
```

### 4. 개발 서버 실행

```bash
npm run dev
```

서버가 http://localhost:3000 에서 실행됩니다.

## 프로젝트 구조

```
server/
├── prisma/
│   └── schema.prisma        # 데이터베이스 스키마
├── src/
│   ├── config/
│   │   └── passport.ts      # Passport 전략 설정
│   ├── middleware/
│   │   └── auth.ts          # 인증 미들웨어
│   ├── routes/
│   │   └── auth.ts          # 인증 라우트
│   ├── utils/
│   │   └── jwt.ts           # JWT 유틸리티
│   └── index.ts             # 서버 진입점
├── package.json
├── tsconfig.json
└── .env.example
```

## API 엔드포인트

### 인증 API

#### 회원가입
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "홍길동"
}
```

#### 로그인
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### 카카오 로그인
```http
GET /api/auth/kakao
```

#### 토큰 갱신
```http
POST /api/auth/refresh
Cookie: refreshToken=...
```

#### 로그아웃
```http
POST /api/auth/logout
Cookie: refreshToken=...
```

#### 사용자 정보 조회
```http
GET /api/auth/me
Authorization: Bearer <access_token>
```

#### 비밀번호 변경
```http
POST /api/auth/change-password
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "oldPassword": "old123",
  "newPassword": "new123"
}
```

## 데이터베이스 스키마

### User 모델
- `id`: UUID
- `email`: String (unique, 선택)
- `password`: String (bcrypt 해싱, 선택)
- `name`: String
- `profileImage`: String (선택)
- `role`: Enum (ADMIN, MANAGER, EMPLOYEE)
- `provider`: Enum (LOCAL, KAKAO, GOOGLE)
- `providerId`: String (선택)
- `refreshTokens`: RefreshToken[]
- `createdAt`: DateTime
- `updatedAt`: DateTime
- `lastLoginAt`: DateTime (선택)

### RefreshToken 모델
- `id`: UUID
- `token`: String (unique)
- `userId`: String
- `expiresAt`: DateTime
- `createdAt`: DateTime

## 보안 기능

### 1. JWT 토큰
- **Access Token**: 15분 유효, API 인증용
- **Refresh Token**: 7일 유효, HttpOnly 쿠키에 저장

### 2. 비밀번호 암호화
- bcrypt 사용 (salt rounds: 10)

### 3. Rate Limiting
- 일반 API: 15분당 100회
- 로그인/회원가입: 15분당 5회

### 4. CORS
- 허용된 origin만 접근 가능
- credentials 지원

### 5. Helmet
- HTTP 헤더 보안 강화

## 환경별 설정

### 개발 환경
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://localhost:5432/postfnb_alba_dev
```

### 프로덕션 환경
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://production-host:5432/postfnb_alba
KAKAO_CALLBACK_URL=https://api.yourdomain.com/api/auth/kakao/callback
CLIENT_URL=https://yourdomain.com
```

## 빌드 및 배포

### 빌드
```bash
npm run build
```

### 프로덕션 실행
```bash
npm start
```

### Docker (선택사항)
```bash
docker build -t postfnb-alba-server .
docker run -p 3000:3000 postfnb-alba-server
```

## 유지보수

### 만료된 토큰 정리
```bash
npm run clean-tokens
```

### Prisma Studio
```bash
npm run prisma:studio
```

### 데이터베이스 마이그레이션 생성
```bash
npx prisma migrate dev --name migration_name
```

## 문제 해결

### 데이터베이스 연결 오류
- PostgreSQL이 실행 중인지 확인
- DATABASE_URL이 올바른지 확인

### Prisma 클라이언트 오류
```bash
npm run prisma:generate
```

### 포트 충돌
- .env 파일에서 PORT 변경

## 라이센스

MIT
