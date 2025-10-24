# 관리자 웹사이트 접속 가이드

## 🚀 서버 실행

### 1. 백엔드 서버 (이미 실행 중)
```bash
cd server
npm run dev
```
✅ 실행 중: http://localhost:3000

### 2. 프론트엔드 서버 시작
```bash
cd client
npm run dev
```
서버 시작 후: http://localhost:5173

---

## 🔐 관리자 로그인

### 접속 URL
**http://localhost:5173**

### 관리자 계정
- **이메일**: `admin@postfnb.com`
- **비밀번호**: `admin123!`
- **권한**: ADMIN (모든 기능 접근 가능)

---

## 📋 관리자가 할 수 있는 작업

### 1. 업체 관리
- ✅ 업체 생성/수정/삭제
- ✅ 업체 관리자 지정
- ✅ 모든 업체 조회

### 2. 일정 관리
- ✅ 근무 일정 생성/수정/삭제
- ✅ 날짜, 시간, 인원, 시급 설정
- ✅ 모든 업체의 일정 관리

### 3. 신청 관리
- ✅ 알바 신청 승인/거부
- ✅ 모든 신청 내역 조회
- ✅ 신청자 정보 확인

### 4. 사용자 관리
- ✅ 사용자 목록 조회
- ✅ 역할 확인
- ✅ 관리자 권한 부여

---

## 🎯 현재 사용 가능한 데이터

### 업체 (3개)
1. **PostFNB 강남점**
   - 주소: 서울시 강남구 테헤란로 123
   - 전화: 02-1234-5678
   - 기본 시급: 10,000원
   - 일정: 4개

2. **PostFNB 홍대점**
   - 주소: 서울시 마포구 양화로 456
   - 전화: 02-2345-6789
   - 기본 시급: 10,500원
   - 일정: 2개

3. **PostFNB 신촌점**
   - 주소: 서울시 서대문구 신촌로 789
   - 전화: 02-3456-7890
   - 기본 시급: 10,000원
   - 일정: 1개

### 일정 (7개)
모두 2025년 10월 3일~4일 일정으로 신청 가능 상태

---

## 🖥️ 브라우저에서 직접 접속

1. **브라우저 열기** (Chrome, Edge, Firefox 등)
2. **주소창에 입력**: `http://localhost:5173`
3. **로그인 페이지에서 입력**:
   - 이메일: `admin@postfnb.com`
   - 비밀번호: `admin123!`
4. **로그인 버튼 클릭**
5. **Dashboard로 자동 이동**

---

## 🔧 문제 해결

### 프론트엔드 서버가 실행되지 않는 경우

```bash
# 1. client 디렉토리로 이동
cd client

# 2. 패키지 설치 (처음 한 번만)
npm install

# 3. 서버 실행
npm run dev
```

### 포트가 이미 사용 중인 경우

```bash
# 5173 포트 사용 중인 프로세스 종료
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process -Force

# 다시 서버 실행
npm run dev
```

### 로그인 후 Dashboard가 안 보이는 경우

1. **F12** 눌러서 개발자 도구 열기
2. **Console** 탭에서 에러 확인
3. **Network** 탭에서 API 요청 확인
4. 브라우저 **새로고침** (F5)

---

## 📱 API 직접 테스트

### 1. 로그인하여 토큰 받기

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@postfnb.com\",\"password\":\"admin123!\"}"
```

응답에서 `accessToken` 복사

### 2. 업체 목록 조회

```bash
curl http://localhost:3000/api/stores \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. 일정 목록 조회

```bash
curl http://localhost:3000/api/schedules \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 📊 데이터베이스에서 직접 확인

### pgAdmin 사용

1. **pgAdmin 실행**
2. **postfnb_alba 데이터베이스 연결**
3. **Query Tool**에서 실행:

```sql
-- 관리자 확인
SELECT id, email, name, role, phone
FROM "User"
WHERE role = 'ADMIN';

-- 업체 및 관리자 확인
SELECT 
    s.name as store_name,
    u.name as manager_name,
    u.email,
    u.role
FROM "StoreManager" sm
JOIN "Store" s ON sm."storeId" = s.id
JOIN "User" u ON sm."userId" = u.id
ORDER BY s.name;
```

### 명령어로 확인

```bash
cd server

# 사용자 목록
npm run list-users

# 업체 및 일정 목록
npm run list-stores
```

---

## 🎨 현재 Dashboard 기능

로그인 후 Dashboard에서 확인 가능:

- ✅ 사용자 정보 (이메일, 전화번호, 역할)
- ✅ 로그인 방식
- ✅ 마지막 로그인 시간
- ✅ 계정 생성일
- ✅ 로그아웃 버튼

---

## 🚧 향후 추가될 관리자 페이지

### Phase 1 (개발 예정)
- 📋 업체 관리 페이지
- 📅 일정 관리 페이지 (캘린더)
- 📝 신청 관리 페이지

### Phase 2 (개발 예정)
- 📊 통계 대시보드
- 💰 급여 관리
- 📈 리포트 생성

---

## 💡 팁

1. **개발자 도구 활용**
   - F12로 Console 확인
   - Network 탭에서 API 요청/응답 확인

2. **토큰 확인**
   - F12 → Application → Local Storage
   - `accessToken` 키 확인

3. **로그 확인**
   - 백엔드: 터미널에서 서버 로그 확인
   - 프론트엔드: 브라우저 Console 확인

---

**준비 완료! 이제 http://localhost:5173 에서 관리자로 로그인하세요! 🎉**
