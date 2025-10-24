# PostFNB Alba - 아르바이트 관리 시스템

소규모 F&B 업체를 위한 아르바이트 근무 관리 및 급여 계산 시스템입니다.

## 🎯 프로젝트 개요

- **프로젝트명**: PostFNB Alba
- **목적**: 아르바이트생 근무 관리 및 급여 계산
- **타겟**: 소규모 F&B 업체
- **아키텍처**: 풀스택 웹 애플리케이션 (React + Express)

## 🏗️ 기술 스택

### 프론트엔드
- **React 18** + TypeScript
- **Vite** - 빌드 도구
- **TailwindCSS** - 스타일링
- **Zustand** - 상태 관리
- **React Router** - 라우팅
- **Axios** - HTTP 클라이언트
- **Material Icons** - 아이콘

### 백엔드
- **Node.js 20** + TypeScript
- **Express.js** - 웹 프레임워크
- **Prisma** - ORM
- **PostgreSQL** - 데이터베이스
- **Passport.js** - 인증
- **JWT** - 토큰 기반 인증
- **bcrypt** - 비밀번호 암호화

### 인증 시스템
- **OAuth2** - 카카오 로그인
- **JWT** - Access Token (15분) + Refresh Token (7일)
- **HttpOnly Cookie** - Refresh Token 저장

## 📁 프로젝트 구조

```
postfnb_alba/
├── client/                      # 프론트엔드 (React + Vite)
│   ├── public/
│   ├── src/
│   │   ├── components/          # 재사용 컴포넌트
│   │   ├── pages/               # 페이지
│   │   │   └── auth/            # 인증 페이지
│   │   ├── services/            # API 서비스
│   │   ├── store/               # Zustand 상태 관리
│   │   └── utils/               # 유틸리티
│   ├── package.json
│   └── vite.config.ts
│
├── server/                      # 백엔드 (Express + Prisma)
│   ├── prisma/
│   │   └── schema.prisma        # DB 스키마
│   ├── src/
│   │   ├── config/              # 설정
│   │   ├── middleware/          # 미들웨어
│   │   ├── routes/              # API 라우트
│   │   └── utils/               # 유틸리티
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                        # 문서
│   ├── AUTH_IMPLEMENTATION.md   # 인증 구현 가이드
│   ├── FRONTEND_SETUP.md        # 프론트엔드 설정
│   └── BACKEND_SETUP.md         # 백엔드 설정
│
├── PROJECT_SETUP.md             # 프로젝트 설계
└── README.md                    # 이 파일
```

## 🚀 빠른 시작

### 사전 요구사항

- Node.js 20+
- PostgreSQL 15+
- npm 또는 pnpm

### 1. 프로젝트 클론

```bash
git clone <repository-url>
cd postfnb_alba
```

### 2. 백엔드 설정 및 실행

```bash
# 서버 디렉토리로 이동
cd server

# 패키지 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일 편집 (DATABASE_URL, JWT_SECRET 등)

# Prisma 설정
npm run prisma:generate
npm run prisma:migrate

# 시드 데이터 생성 (테스트 계정)
npm run prisma:seed

# 개발 서버 실행
npm run dev
```

서버: http://localhost:3000

### 3. 프론트엔드 설정 및 실행

```bash
# 새 터미널에서 클라이언트 디렉토리로 이동
cd client

# 패키지 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일 편집 (VITE_API_URL)

# 개발 서버 실행
npm run dev
```

클라이언트: http://localhost:5173

### 4. 테스트

브라우저에서 http://localhost:5173 접속 후 테스트 계정으로 로그인:

- **관리자**: admin@postfnb.com / admin123!
- **매니저**: manager@postfnb.com / manager123!
- **직원**: employee@postfnb.com / employee123!

## 🔐 인증 시스템

### 로그인 방식

1. **로컬 로그인**: 이메일 + 비밀번호
2. **소셜 로그인**: 카카오 OAuth2

### JWT 토큰 구조

- **Access Token**: 
  - 유효기간: 15분
  - 저장 위치: localStorage
  - 용도: API 요청 인증

- **Refresh Token**:
  - 유효기간: 7일
  - 저장 위치: HttpOnly 쿠키
  - 용도: Access Token 갱신

### 자동 토큰 갱신

Axios 인터셉터가 401 에러 발생 시 자동으로 Refresh Token을 사용하여 Access Token을 갱신합니다.

## 📡 주요 API 엔드포인트

### 인증 API

| 메소드 | 엔드포인트 | 설명 |
|--------|------------|------|
| POST | `/api/auth/register` | 회원가입 |
| POST | `/api/auth/login` | 로그인 |
| GET | `/api/auth/kakao` | 카카오 로그인 |
| POST | `/api/auth/refresh` | 토큰 갱신 |
| POST | `/api/auth/logout` | 로그아웃 |
| GET | `/api/auth/me` | 사용자 정보 |

### 업체 관리 API (NEW!)

| 메소드 | 엔드포인트 | 설명 | 권한 |
|--------|------------|------|------|
| GET | `/api/stores` | 업체 목록 | ALL |
| POST | `/api/stores` | 업체 생성 | ADMIN |
| GET | `/api/stores/:id` | 업체 상세 | ALL |
| PUT | `/api/stores/:id` | 업체 수정 | ADMIN, MANAGER |
| DELETE | `/api/stores/:id` | 업체 삭제 | ADMIN |
| POST | `/api/stores/:id/managers` | 관리자 추가 | ADMIN |
| DELETE | `/api/stores/:id/managers/:userId` | 관리자 제거 | ADMIN |

### 일정 관리 API (NEW!)

| 메소드 | 엔드포인트 | 설명 | 권한 |
|--------|------------|------|------|
| GET | `/api/schedules` | 일정 목록 | ALL |
| POST | `/api/schedules` | 일정 생성 | ADMIN, MANAGER |
| GET | `/api/schedules/:id` | 일정 상세 | ALL |
| PUT | `/api/schedules/:id` | 일정 수정 | ADMIN, MANAGER |
| DELETE | `/api/schedules/:id` | 일정 삭제 | ADMIN, MANAGER |

### 신청 관리 API (NEW!)

| 메소드 | 엔드포인트 | 설명 | 권한 |
|--------|------------|------|------|
| GET | `/api/applications` | 신청 목록 | ALL |
| POST | `/api/applications` | 알바 신청 | EMPLOYEE |
| GET | `/api/applications/:id` | 신청 상세 | ALL |
| PUT | `/api/applications/:id/approve` | 신청 승인 | ADMIN, MANAGER |
| PUT | `/api/applications/:id/reject` | 신청 거부 | ADMIN, MANAGER |
| DELETE | `/api/applications/:id` | 신청 취소 | 본인 |

## 🔒 보안 기능

### 구현된 보안 기능

- ✅ **JWT 이중 토큰** - Access + Refresh Token
- ✅ **HttpOnly 쿠키** - XSS 공격 방지
- ✅ **bcrypt** - 비밀번호 암호화 (salt rounds: 10)
- ✅ **Rate Limiting** - 무차별 대입 공격 방지
- ✅ **Helmet** - HTTP 헤더 보안
- ✅ **CORS** - 허용된 origin만 접근

### Rate Limiting

- 일반 API: 15분당 100회
- 로그인/회원가입: 15분당 5회

## 📚 문서

- [프로젝트 설계](./PROJECT_SETUP.md) - 전체 구조 및 기술 스택
- [인증 구현](./docs/AUTH_IMPLEMENTATION.md) - OAuth2 + JWT 요약
- [프론트엔드 가이드](./docs/FRONTEND_SETUP.md) - React 설정 및 구현
- [백엔드 가이드](./docs/BACKEND_SETUP.md) - Express 설정 및 구현

## 🎨 주요 기능

### 현재 구현된 기능 (v1.0)

#### 인증 시스템
- ✅ 회원가입 / 로그인
- ✅ 카카오 소셜 로그인
- ✅ JWT 토큰 기반 인증
- ✅ 자동 토큰 갱신
- ✅ 역할 기반 권한 (ADMIN, MANAGER, EMPLOYEE)
- ✅ 보호된 라우트
- ✅ 비밀번호 변경
- ✅ 프로필 조회

#### 알바 관리 시스템 (NEW! 🎉)
- ✅ **다중 업체 관리** - 여러 지점 등록 및 관리
- ✅ **업체 관리자 지정** - 업체별 관리자 권한 부여
- ✅ **근무 일정 관리** - 날짜/시간별 일정 생성
- ✅ **인원 지정** - 시간대별 필요 인원 설정
- ✅ **알바 신청** - 직원이 일정에 신청
- ✅ **신청 승인/거부** - 관리자가 신청 처리
- ✅ **시급 관리** - 업체별, 일정별 시급 설정
- ✅ **정원 관리** - 자동 정원 체크 및 마감
- ✅ **시간 충돌 체크** - 중복 신청 방지
- ✅ **근무 기록 자동 생성** - 승인 시 자동 생성

### 향후 계획 (v2.0)

- ⏳ 출퇴근 체크 (QR 코드, GPS)
- ⏳ 급여 자동 계산
- ⏳ 알림 시스템 (실시간)
- ✅ 엑셀 내보내기
- ⏳ 대시보드 통계
- ⏳ 모바일 앱

## 🛠️ 개발 명령어

### 백엔드

```bash
cd server

# 개발 서버
npm run dev

# 빌드
npm run build

# 프로덕션 실행
npm start

# Prisma Studio (DB GUI)
npm run prisma:studio

# 만료된 토큰 정리
npm run clean-tokens
```

### 프론트엔드

```bash
cd client

# 개발 서버
npm run dev

# 빌드
npm run build

# 빌드 미리보기
npm run preview

# 린트
npm run lint
```

## 🧪 테스트

### 테스트 계정

시드 데이터로 생성된 계정:

| 역할 | 이메일 | 비밀번호 |
|------|--------|----------|
| 관리자 | admin@postfnb.com | admin123! |
| 매니저 | manager@postfnb.com | manager123! |
| 직원 | employee@postfnb.com | employee123! |

### API 테스트

Postman 또는 curl로 API 테스트:

```bash
# 로그인
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@postfnb.com","password":"admin123!"}'

# 사용자 정보 조회
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🌐 배포

### 프론트엔드 배포

추천 플랫폼:
- Vercel
- Netlify
- AWS S3 + CloudFront

### 백엔드 배포

추천 플랫폼:
- AWS EC2 + RDS
- Heroku
- Railway
- Render

### 환경 변수 설정

프로덕션 환경에서는 다음을 변경해야 합니다:

- `NODE_ENV=production`
- `KAKAO_CALLBACK_URL` - 실제 도메인
- `CLIENT_URL` - 실제 클라이언트 URL
- `JWT_ACCESS_SECRET` - 강력한 시크릿 키
- `JWT_REFRESH_SECRET` - 강력한 시크릿 키

## ⚠️ 주의사항

1. **.env 파일 관리**
   - `.env` 파일은 절대 Git에 커밋하지 마세요
   - `.env.example`을 참고하여 생성하세요

2. **시크릿 키 생성**
   ```bash
   # 랜덤 시크릿 키 생성
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **프로덕션 체크리스트**
   - [ ] HTTPS 적용
   - [ ] 강력한 JWT 시크릿 키
   - [ ] CORS origin 제한
   - [ ] Rate Limiting 조정
   - [ ] 데이터베이스 백업 설정
   - [ ] 로깅 시스템 구축
   - [ ] 모니터링 설정

## 🤝 기여

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이센스

MIT License

## 📞 문의

프로젝트 관련 문의사항이 있으시면 이슈를 등록해주세요.

---

**Built with ❤️ using React, Express, and TypeScript**
#   p o s t f n b _ a l b a  
 #   p o s t f n b _ a l b a  
 