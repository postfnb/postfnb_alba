# 변경 이력 (Changelog)

## [2025-10-01] 휴대폰 번호 필드 추가 (필수)

### ✨ 새로운 기능

#### 회원가입에 휴대폰 번호 추가
- 사용자가 회원가입 시 휴대폰 번호를 **필수로** 입력해야 합니다
- 휴대폰 번호 형식 자동 검증 (010-XXXX-XXXX)
- 중복 휴대폰 번호 체크

### 🔧 변경된 파일

#### 백엔드

1. **데이터베이스 스키마** (`server/prisma/schema.prisma`)
   ```prisma
   model User {
     phone String // 필수 필드로 추가됨
     @@index([phone]) // 인덱스 추가
   }
   ```

2. **회원가입 API** (`server/src/routes/auth.ts`)
   - 휴대폰 번호 **필수** 입력
   - 휴대폰 번호 형식 검증 (정규식: `^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$`)
   - 휴대폰 번호 중복 체크
   - 응답에 phone 필드 추가
   - 에러 메시지: "모든 필수 필드를 입력해주세요."

3. **사용자 정보 응답**
   - `/api/auth/register` - phone 필드 추가
   - `/api/auth/login` - phone 필드 추가
   - `/api/auth/me` - phone 필드 추가

#### 프론트엔드

1. **타입 정의** (`client/src/services/auth.ts`)
   ```typescript
   interface User {
     phone: string; // 필수 필드로 추가됨
   }
   
   interface RegisterRequest {
     phone: string; // 필수 필드로 추가됨
   }
   ```

2. **상태 관리** (`client/src/store/authStore.ts`)
   ```typescript
   register: (email, password, name, phone) => Promise<void>
   ```

3. **회원가입 페이지** (`client/src/pages/auth/Register.tsx`)
   - 휴대폰 번호 **필수** 입력 필드 추가
   - 실시간 형식 검증
   - 빈 값 체크
   - 에러 메시지 표시
   - Material Icons `phone` 아이콘 사용

### 📋 데이터베이스 마이그레이션 필요

백엔드를 실행하기 전에 데이터베이스 마이그레이션을 수행해야 합니다:

```bash
cd server
npm run prisma:migrate
```

마이그레이션 이름 입력: `add_phone_to_user`

### 🧪 테스트 방법

#### 1. 회원가입 테스트

**프론트엔드**
```
1. http://localhost:5173/register 접속
2. 이름, 이메일, 휴대폰 번호(선택), 비밀번호 입력
3. 회원가입 버튼 클릭
```

**API 테스트**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "홍길동",
    "phone": "010-1234-5678"
  }'
```

#### 2. 휴대폰 번호 형식 검증

**유효한 형식**
- `010-1234-5678` ✅
- `01012345678` ✅
- `010-123-4567` ✅

**무효한 형식**
- `02-1234-5678` ❌ (지역번호)
- `010-12-5678` ❌ (자릿수 부족)
- `010-12345-6789` ❌ (자릿수 초과)

#### 3. 중복 체크

동일한 휴대폰 번호로 회원가입 시도:
```
오류 메시지: "이미 등록된 휴대폰 번호입니다."
```

### 🔐 보안 고려사항

- 휴대폰 번호는 **필수 입력**입니다
- 휴대폰 번호는 데이터베이스에 인덱싱되어 빠른 검색 가능
- 개인정보이므로 HTTPS 환경에서만 전송 권장
- 휴대폰 번호 중복 체크로 계정 보안 강화
- 1인 1계정 원칙 강화

### 📝 향후 개선 사항

- [ ] 휴대폰 번호 인증 (SMS)
- [ ] 휴대폰 번호 변경 기능
- [ ] 비밀번호 찾기에 휴대폰 번호 활용
- [ ] 2단계 인증 (2FA)

---

## [2025-09-30] 초기 프로젝트 설정

### ✨ 구현 완료

- OAuth2 + JWT 인증 시스템
- 카카오 소셜 로그인
- 회원가입/로그인 페이지
- 역할 기반 권한 (ADMIN, MANAGER, EMPLOYEE)
- 자동 토큰 갱신 (Axios 인터셉터)
- 보호된 라우트
- Prisma ORM 연동
- PostgreSQL 데이터베이스
