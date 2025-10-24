# 백엔드 구현 완료

## ✅ 구현된 파일 목록

### 핵심 파일
- ✅ `server/src/index.ts` - Express 서버
- ✅ `server/src/config/passport.ts` - Passport 인증 전략
- ✅ `server/src/routes/auth.ts` - 인증 API 라우트
- ✅ `server/src/middleware/auth.ts` - 인증 미들웨어
- ✅ `server/src/utils/jwt.ts` - JWT 유틸리티

### 데이터베이스
- ✅ `server/prisma/schema.prisma` - DB 스키마
- ✅ `server/prisma/seed.ts` - 시드 데이터

### 설정 파일
- ✅ `server/package.json` - 의존성
- ✅ `server/tsconfig.json` - TypeScript 설정
- ✅ `server/.env.example` - 환경 변수 예시

### 유틸리티
- ✅ `server/src/scripts/cleanTokens.ts` - 만료 토큰 정리

## 🚀 빠른 시작

### 1. PostgreSQL 설치 및 실행

#### Windows (PostgreSQL 설치)
```powershell
# Chocolatey로 설치
choco install postgresql

# 또는 https://www.postgresql.org/download/windows/ 에서 다운로드
```

#### 데이터베이스 생성
```bash
# PostgreSQL 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE postfnb_alba;

# 사용자 생성 (선택사항)
CREATE USER alba_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE postfnb_alba TO alba_user;

# 종료
\q
```

### 2. 백엔드 설정

```bash
# 서버 디렉토리로 이동
cd server

# 패키지 설치
npm install

# 환경 변수 설정
cp .env.example .env
```

### 3. 환경 변수 설정 (.env)

```env
# 필수 설정
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/postfnb_alba

# JWT 시크릿 (랜덤 문자열로 변경)
JWT_ACCESS_SECRET=your-super-secret-access-key-123456
JWT_REFRESH_SECRET=your-super-secret-refresh-key-789012

# 카카오 로그인 (추후 설정)
KAKAO_CLIENT_ID=your-kakao-client-id
KAKAO_CLIENT_SECRET=
KAKAO_CALLBACK_URL=http://localhost:3000/api/auth/kakao/callback

# 클라이언트 URL
CLIENT_URL=http://localhost:5173
```

### 4. Prisma 설정 및 마이그레이션

```bash
# Prisma 클라이언트 생성
npm run prisma:generate

# 데이터베이스 마이그레이션 (테이블 생성)
npm run prisma:migrate

# 시드 데이터 생성 (테스트 계정)
npm run prisma:seed
```

### 5. 서버 실행

```bash
# 개발 모드 실행
npm run dev
```

서버가 http://localhost:3000 에서 실행됩니다.

### 6. 서버 테스트

브라우저나 Postman에서 확인:
- http://localhost:3000 - API 정보
- http://localhost:3000/health - 헬스 체크

## 📡 API 엔드포인트

### 인증 API

| 메소드 | 엔드포인트 | 설명 | 인증 필요 |
|--------|------------|------|-----------|
| POST | `/api/auth/register` | 회원가입 | ❌ |
| POST | `/api/auth/login` | 로그인 | ❌ |
| GET | `/api/auth/kakao` | 카카오 로그인 시작 | ❌ |
| GET | `/api/auth/kakao/callback` | 카카오 콜백 | ❌ |
| POST | `/api/auth/refresh` | 토큰 갱신 | ❌ (쿠키) |
| POST | `/api/auth/logout` | 로그아웃 | ❌ (쿠키) |
| POST | `/api/auth/logout-all` | 전체 로그아웃 | ✅ |
| GET | `/api/auth/me` | 사용자 정보 | ✅ |
| POST | `/api/auth/change-password` | 비밀번호 변경 | ✅ |

## 🧪 테스트 계정

시드 데이터로 생성된 테스트 계정:

### 관리자
- 이메일: `admin@postfnb.com`
- 비밀번호: `admin123!`
- 역할: ADMIN

### 매니저
- 이메일: `manager@postfnb.com`
- 비밀번호: `manager123!`
- 역할: MANAGER

### 직원
- 이메일: `employee@postfnb.com`
- 비밀번호: `employee123!`
- 역할: EMPLOYEE

## 📋 API 사용 예시

### 1. 회원가입
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "테스트 사용자"
  }'
```

### 2. 로그인
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@postfnb.com",
    "password": "admin123!"
  }' \
  -c cookies.txt
```

### 3. 사용자 정보 조회
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. 토큰 갱신
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -b cookies.txt
```

## 🔐 보안 기능

### 1. JWT 이중 토큰
- **Access Token**: 15분, localStorage
- **Refresh Token**: 7일, HttpOnly 쿠키

### 2. Rate Limiting
- 일반 API: 15분당 100회
- 로그인/회원가입: 15분당 5회

### 3. 비밀번호 암호화
- bcrypt (salt rounds: 10)

### 4. CORS
- 특정 origin만 허용
- credentials 지원

### 5. Helmet
- HTTP 헤더 보안

## 🛠️ 유용한 명령어

### Prisma Studio (DB GUI)
```bash
npm run prisma:studio
```
http://localhost:5555 에서 데이터베이스 확인

### 만료된 토큰 정리
```bash
npm run clean-tokens
```

### 프로덕션 빌드
```bash
npm run build
npm start
```

### 데이터베이스 리셋
```bash
npx prisma migrate reset
npm run prisma:seed
```

## 🔧 카카오 개발자 설정

### 1. 애플리케이션 생성
1. https://developers.kakao.com/ 접속
2. 내 애플리케이션 > 애플리케이션 추가
3. 앱 이름 입력

### 2. REST API 키 복사
- 앱 설정 > 앱 키 > REST API 키
- `.env`의 `KAKAO_CLIENT_ID`에 입력

### 3. Redirect URI 설정
- 제품 설정 > 카카오 로그인 > 활성화
- Redirect URI: `http://localhost:3000/api/auth/kakao/callback`

### 4. 동의 항목 설정
- 닉네임, 프로필 사진 (필수)
- 이메일 (선택 - 비즈 앱 전환 필요)

## ⚠️ 문제 해결

### 데이터베이스 연결 오류
```bash
# PostgreSQL 실행 확인
# Windows 서비스에서 PostgreSQL 실행 상태 확인

# DATABASE_URL 확인
echo $env:DATABASE_URL
```

### Prisma 클라이언트 오류
```bash
npm run prisma:generate
```

### 포트 충돌
```env
# .env 파일에서 PORT 변경
PORT=3001
```

### CORS 오류
```env
# CLIENT_URL 확인
CLIENT_URL=http://localhost:5173
```

## 📚 다음 단계

### 프론트엔드 연동
1. 클라이언트 실행: `cd client && npm run dev`
2. 로그인 테스트: http://localhost:5173/login
3. 테스트 계정으로 로그인

### 추가 기능 구현
- [ ] 이메일 인증
- [ ] 비밀번호 재설정
- [ ] 프로필 사진 업로드
- [ ] 구글 로그인
- [ ] 2FA 인증

### 배포 준비
- [ ] 환경 변수 프로덕션 설정
- [ ] HTTPS 적용
- [ ] 데이터베이스 백업
- [ ] 로깅 시스템
- [ ] 모니터링 설정

## 📖 참고 문서

- [Express 공식 문서](https://expressjs.com)
- [Prisma 공식 문서](https://www.prisma.io/docs)
- [Passport.js 공식 문서](http://www.passportjs.org)
- [JWT 공식 사이트](https://jwt.io)
