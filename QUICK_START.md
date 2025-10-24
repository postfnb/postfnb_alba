# 🚀 PostFNB Alba - 빠른 시작 가이드

## ✅ 현재 상태

### 서버 상태
- ✅ 백엔드 서버: **실행 중** (http://localhost:3000)
- ✅ 프론트엔드 서버: **실행 중** (http://localhost:5173)
- ✅ 데이터베이스: **마이그레이션 완료**
- ✅ 시드 데이터: **생성 완료**

### 생성된 데이터
- **사용자**: 4명 (admin, manager, employee, 박찬호)
- **업체**: 3개 (강남점, 홍대점, 신촌점)
- **일정**: 7개 (내일, 모레 일정)

---

## 🎯 즉시 테스트 가능

### 1. 로그인
브라우저에서 http://localhost:5173 접속

**테스트 계정**:
- 관리자: `admin@postfnb.com` / `admin123!`
- 매니저: `manager@postfnb.com` / `manager123!`
- 직원: `employee@postfnb.com` / `employee123!`

### 2. API 테스트

#### 업체 목록 조회
```bash
curl http://localhost:3000/api/stores \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### 일정 목록 조회
```bash
curl http://localhost:3000/api/schedules
```

#### 신청 가능한 일정만 조회
```bash
curl "http://localhost:3000/api/schedules?status=available"
```

---

## 📊 데이터 확인

### 명령어로 확인
```bash
cd server

# 사용자 목록
npm run list-users

# 업체 및 일정 목록
npm run list-stores
```

### pgAdmin으로 확인
1. pgAdmin 실행
2. `postfnb_alba` 데이터베이스 연결
3. Query Tool에서 실행:

```sql
-- 업체 목록
SELECT * FROM "Store";

-- 일정 목록
SELECT 
    s.name as store_name,
    sc.date,
    sc."startTime",
    sc."endTime",
    sc."requiredCount",
    sc."hourlyWage",
    sc.description
FROM "Schedule" sc
JOIN "Store" s ON sc."storeId" = s.id
ORDER BY sc.date, sc."startTime";
```

---

## 🎨 주요 기능 테스트

### 1. 관리자 기능 (admin@postfnb.com)

#### 업체 생성
```bash
curl -X POST http://localhost:3000/api/stores \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "PostFNB 판교점",
    "address": "경기도 성남시 분당구",
    "phone": "031-1234-5678",
    "baseHourlyWage": 11000
  }'
```

#### 일정 생성
```bash
curl -X POST http://localhost:3000/api/schedules \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "storeId": "store-gangnam",
    "date": "2025-10-05",
    "startTime": "09:00",
    "endTime": "18:00",
    "requiredCount": 3,
    "hourlyWage": 10000,
    "description": "주말 근무"
  }'
```

### 2. 직원 기능 (employee@postfnb.com)

#### 알바 신청
```bash
curl -X POST http://localhost:3000/api/applications \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "scheduleId": "SCHEDULE_ID",
    "message": "열심히 일하겠습니다!"
  }'
```

#### 내 신청 목록
```bash
curl http://localhost:3000/api/applications \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. 매니저 기능 (manager@postfnb.com)

#### 신청 승인
```bash
curl -X PUT http://localhost:3000/api/applications/APPLICATION_ID/approve \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### 신청 거부
```bash
curl -X PUT http://localhost:3000/api/applications/APPLICATION_ID/reject \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rejectReason": "다른 직원이 이미 배정되었습니다."
  }'
```

---

## 🔧 문제 해결

### 서버가 실행되지 않는 경우

```bash
# 1. Node 프로세스 종료
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# 2. Prisma Client 재생성
cd server
npx prisma generate

# 3. 서버 재시작
npm run dev
```

### 데이터베이스 초기화

```bash
cd server

# 1. 데이터베이스 리셋 (주의: 모든 데이터 삭제!)
npx prisma migrate reset

# 2. 시드 데이터 재생성
npm run prisma:seed
npm run prisma:seed-stores
```

### 토큰 만료 시

프론트엔드에서 자동으로 갱신되지만, 수동으로 갱신하려면:

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  --cookie "refreshToken=YOUR_REFRESH_TOKEN"
```

---

## 📚 다음 단계

### 프론트엔드 UI 개발

1. **업체 관리 페이지**
   - `client/src/pages/stores/StoreList.tsx`
   - `client/src/pages/stores/StoreForm.tsx`

2. **일정 관리 페이지**
   - `client/src/pages/schedules/ScheduleCalendar.tsx`
   - `client/src/pages/schedules/ScheduleForm.tsx`

3. **신청 관리 페이지**
   - `client/src/pages/applications/ApplicationList.tsx`
   - `client/src/pages/applications/MyApplications.tsx`

### 추가 기능 개발

1. **근무 기록 API**
   - 출퇴근 체크
   - 급여 계산

2. **알림 시스템**
   - 이메일 알림
   - 실시간 알림 (WebSocket)

3. **통계 대시보드**
   - 업체별 통계
   - 직원별 통계
   - 급여 리포트

---

## 🎯 유용한 명령어

### 개발 중
```bash
# 백엔드 서버 재시작
cd server
npm run dev

# 프론트엔드 서버 재시작
cd client
npm run dev

# Prisma Studio (DB GUI)
cd server
npm run prisma:studio
```

### 데이터 확인
```bash
# 사용자 목록
npm run list-users

# 업체 및 일정 목록
npm run list-stores

# 만료된 토큰 정리
npm run clean-tokens
```

### 데이터베이스
```bash
# 마이그레이션 상태 확인
npx prisma migrate status

# 새 마이그레이션 생성
npx prisma migrate dev --name migration_name

# Prisma Client 재생성
npx prisma generate
```

---

## 📞 도움말

### 문서
- [전체 시스템 설계](./docs/ALBA_MANAGEMENT_PLAN.md)
- [개발 진행 상황](./docs/DEVELOPMENT_PROGRESS.md)
- [마이그레이션 가이드](./docs/DATABASE_MIGRATION_GUIDE.md)
- [pgAdmin 사용법](./docs/PGADMIN_GUIDE.md)

### API 문서
서버 실행 후 http://localhost:3000 접속하면 사용 가능한 엔드포인트 목록 확인 가능

### 데이터베이스
- **호스트**: localhost:5432
- **데이터베이스**: postfnb_alba
- **스키마**: public

---

**모든 준비가 완료되었습니다! 🎉**

이제 프론트엔드 UI를 개발하거나 추가 기능을 구현할 수 있습니다.
