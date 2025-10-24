# 개발 진행 상황

## ✅ 완료된 작업

### 1. 기본 인증 시스템
- [x] 사용자 모델 (User)
- [x] 회원가입 API
- [x] 로그인 API (이메일/비밀번호)
- [x] 카카오 로그인 OAuth
- [x] JWT 토큰 인증
- [x] Refresh Token 관리
- [x] 로그아웃 API
- [x] 비밀번호 변경 API

### 2. 프론트엔드 인증
- [x] 로그인 페이지
- [x] 회원가입 페이지
- [x] Dashboard 페이지
- [x] 인증 상태 관리 (Zustand)
- [x] Protected Route
- [x] 로그인 후 자동 리다이렉트

### 3. 데이터베이스 스키마 설계
- [x] Store (업체) 모델
- [x] StoreManager (업체 관리자) 모델
- [x] Schedule (근무 일정) 모델
- [x] Application (알바 신청) 모델
- [x] WorkRecord (근무 기록) 모델

### 4. 백엔드 API 개발
- [x] Store API (업체 CRUD)
  - GET /api/stores - 업체 목록
  - GET /api/stores/:id - 업체 상세
  - POST /api/stores - 업체 생성 (ADMIN)
  - PUT /api/stores/:id - 업체 수정 (ADMIN, MANAGER)
  - DELETE /api/stores/:id - 업체 삭제 (ADMIN)
  - POST /api/stores/:id/managers - 관리자 추가
  - DELETE /api/stores/:id/managers/:userId - 관리자 제거

- [x] Schedule API (일정 CRUD)
  - GET /api/schedules - 일정 목록 (필터: storeId, date, status)
  - GET /api/schedules/:id - 일정 상세
  - POST /api/schedules - 일정 생성 (ADMIN, MANAGER)
  - PUT /api/schedules/:id - 일정 수정 (ADMIN, MANAGER)
  - DELETE /api/schedules/:id - 일정 삭제 (ADMIN, MANAGER)

- [x] Application API (신청 관리)
  - GET /api/applications - 신청 목록
  - GET /api/applications/:id - 신청 상세
  - POST /api/applications - 알바 신청 (EMPLOYEE)
  - PUT /api/applications/:id/approve - 신청 승인 (ADMIN, MANAGER)
  - PUT /api/applications/:id/reject - 신청 거부 (ADMIN, MANAGER)
  - DELETE /api/applications/:id - 신청 취소 (본인)

### 5. 시드 데이터
- [x] 사용자 시드 (admin, manager, employee)
- [x] 업체 시드 스크립트 작성
- [x] 샘플 일정 생성 스크립트

---

## 🔄 다음 단계 (마이그레이션 필요)

### 1. 데이터베이스 마이그레이션 실행

**중요**: 서버를 중지한 후 실행하세요!

```bash
# 1. 서버 중지 (Ctrl+C)

# 2. Prisma Client 생성
cd server
npx prisma generate

# 3. 마이그레이션 실행
npx prisma migrate dev --name add_alba_management_tables

# 4. 시드 데이터 생성
npm run prisma:seed
npm run prisma:seed-stores

# 5. 서버 재시작
npm run dev
```

### 2. API 테스트

마이그레이션 완료 후 API 테스트:

```bash
# 업체 목록 조회
curl http://localhost:3000/api/stores \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 일정 목록 조회
curl http://localhost:3000/api/schedules

# 신청 목록 조회
curl http://localhost:3000/api/applications
```

---

## 📝 남은 작업

### Phase 1: 프론트엔드 UI 개발 ✅ 완료!

#### 1. 업체 관리 페이지 (ADMIN, MANAGER)
- [x] 업체 목록 페이지
- [x] 업체 생성/수정 모달
- [x] 업체 삭제 기능
- [x] 관리자 표시

#### 2. 일정 관리 페이지 (ADMIN, MANAGER)
- [x] 일정 목록 뷰
- [x] 일정 생성 모달
  - 날짜 선택
  - 시간 선택
  - 필요 인원
  - 시급 설정
- [x] 업체별 필터
- [x] 신청 현황 표시 (모집중/진행중/마감)
- [x] 일정 삭제 기능

#### 3. 신청 관리 페이지 (ADMIN, MANAGER)
- [x] 신청 목록 (대기/승인/거부/취소)
- [x] 신청 상세 정보 표시
- [x] 승인/거부 버튼
- [x] 거부 사유 입력 모달
- [x] 상태별 필터

#### 4. 직원용 페이지 (EMPLOYEE) ✅ 완료!
- [x] 일정 조회 페이지 (알바 찾기)
  - 신청 가능한 일정만 표시
  - 미래 일정만 필터링
  - 예상 급여 계산 및 표시
- [x] 일정 신청 모달
  - 신청 메시지 입력
  - 일정 정보 확인
- [x] 내 신청 내역
  - 상태별 통계 (전체/대기/승인/거부)
  - 상태별 필터
  - 신청 취소 기능 (대기중만)
  - 거부 사유 표시
- [ ] 근무 기록
  - 예정된 근무
  - 완료된 근무

### Phase 2: 근무 기록 및 급여

#### 1. WorkRecord API
- [ ] GET /api/work-records - 근무 기록 목록
- [ ] PUT /api/work-records/:id/start - 출근 체크
- [ ] PUT /api/work-records/:id/end - 퇴근 체크
- [ ] GET /api/work-records/salary - 급여 조회

#### 2. 급여 계산
- [ ] 근무 시간 계산
- [ ] 시급 × 시간 계산
- [ ] 월별 급여 집계
- [ ] 급여 명세서 생성

#### 3. 출퇴근 관리
- [ ] QR 코드 출근 체크
- [ ] GPS 위치 확인
- [ ] 지각/조퇴 관리

### Phase 3: 고급 기능

#### 1. 알림 시스템
- [ ] 신청 접수 알림 (관리자)
- [ ] 승인/거부 알림 (직원)
- [ ] 근무 시작 알림
- [ ] 정원 마감 알림

#### 2. 통계 및 리포트
- [ ] 관리자 대시보드
  - 업체별 통계
  - 직원별 통계
  - 월별 리포트
- [ ] 직원 대시보드
  - 이번 달 근무
  - 예상 급여
  - 신청 현황

#### 3. 추가 기능
- [ ] 반복 일정 생성
- [ ] 엑셀 내보내기
- [ ] 모바일 반응형 UI
- [ ] 실시간 알림 (WebSocket)

---

## 🎯 현재 우선순위

1. **데이터베이스 마이그레이션 실행** ⭐⭐⭐
2. **API 테스트 및 버그 수정**
3. **프론트엔드 업체 관리 페이지**
4. **프론트엔드 일정 관리 페이지 (캘린더)**
5. **프론트엔드 신청 관리 페이지**

---

## 📂 파일 구조

```
server/
├── prisma/
│   ├── schema.prisma          # 데이터베이스 스키마
│   ├── seed.ts                # 사용자 시드
│   ├── seed-stores.ts         # 업체 시드
│   └── queries.sql            # SQL 쿼리 모음
├── src/
│   ├── routes/
│   │   ├── auth.ts            # 인증 API
│   │   ├── stores.ts          # 업체 API ✨ NEW
│   │   ├── schedules.ts       # 일정 API ✨ NEW
│   │   └── applications.ts    # 신청 API ✨ NEW
│   ├── middleware/
│   │   └── auth.ts            # 인증 미들웨어
│   ├── config/
│   │   └── passport.ts        # Passport 설정
│   ├── utils/
│   │   └── jwt.ts             # JWT 유틸
│   ├── scripts/
│   │   ├── listUsers.ts       # 사용자 목록
│   │   └── cleanTokens.ts     # 토큰 정리
│   └── index.ts               # 서버 진입점

client/
├── src/
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   └── AuthCallback.tsx
│   │   └── Dashboard.tsx
│   ├── store/
│   │   └── authStore.ts
│   ├── services/
│   │   └── auth.ts
│   ├── components/
│   │   └── ProtectedRoute.tsx
│   └── App.tsx

docs/
├── ALBA_MANAGEMENT_PLAN.md        # 전체 시스템 설계
├── DATABASE_MIGRATION_GUIDE.md    # 마이그레이션 가이드
├── DEVELOPMENT_PROGRESS.md        # 개발 진행 상황 (현재 파일)
├── BACKEND_SETUP.md               # 백엔드 설정
├── FRONTEND_SETUP.md              # 프론트엔드 설정
├── PGADMIN_GUIDE.md               # pgAdmin 사용법
└── POSTGRESQL_INSTALL.md          # PostgreSQL 설치
```

---

## 🐛 알려진 이슈

1. **Prisma Client 미생성**
   - 증상: TypeScript 타입 에러
   - 해결: `npx prisma generate` 실행

2. **서버 실행 중 마이그레이션 실패**
   - 증상: EPERM 에러
   - 해결: 서버 중지 후 마이그레이션

---

## 📞 테스트 계정

### 관리자 (ADMIN)
- 이메일: admin@postfnb.com
- 비밀번호: admin123!
- 권한: 모든 업체 관리

### 매니저 (MANAGER)
- 이메일: manager@postfnb.com
- 비밀번호: manager123!
- 권한: 지정된 업체만 관리

### 직원 (EMPLOYEE)
- 이메일: employee@postfnb.com
- 비밀번호: employee123!
- 권한: 일정 조회 및 신청

---

## 🚀 빠른 시작

```bash
# 1. 백엔드 서버 시작
cd server
npm run dev

# 2. 프론트엔드 서버 시작 (새 터미널)
cd client
npm run dev

# 3. 브라우저에서 접속
http://localhost:5173

# 4. 로그인
admin@postfnb.com / admin123!
```
