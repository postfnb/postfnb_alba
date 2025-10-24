# 알바 등록 관리 시스템 설계

## 📋 주요 기능

### 1. 다중 업체 관리
- 여러 업체(지점) 등록 및 관리
- 업체별 독립적인 알바 관리
- 업체별 관리자 지정

### 2. 일자별/시간별 스케줄 관리
- 날짜별 근무 일정 생성
- 시간대별 근무 시간 설정 (예: 09:00-18:00)
- 요일별 반복 일정 설정

### 3. 인원 지정
- 시간대별 필요 인원 수 설정
- 현재 신청/승인 인원 추적
- 정원 초과 방지

### 4. 알바 신청/승인 프로세스
- 직원이 근무 일정 신청
- 관리자가 신청 승인/거부
- 신청 상태 추적 (대기/승인/거부)

### 5. 시급 관리
- 업체별 기본 시급 설정
- 시간대별 차등 시급 (야간, 주말 수당)
- 직원별 개별 시급 설정 가능

---

## 🗄️ 데이터베이스 스키마 설계

### 1. Store (업체/지점)
```prisma
model Store {
  id              String    @id @default(uuid())
  name            String    // 업체명
  address         String?   // 주소
  phone           String?   // 연락처
  description     String?   // 설명
  
  // 기본 시급 정보
  baseHourlyWage  Int       @default(9860) // 기본 시급 (2024년 최저시급)
  
  // 관계
  managers        StoreManager[]  // 업체 관리자
  schedules       Schedule[]      // 근무 일정
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

### 2. StoreManager (업체 관리자)
```prisma
model StoreManager {
  id        String   @id @default(uuid())
  storeId   String
  userId    String
  
  store     Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now())
  
  @@unique([storeId, userId])
}
```

### 3. Schedule (근무 일정)
```prisma
model Schedule {
  id              String    @id @default(uuid())
  storeId         String
  
  // 일정 정보
  date            DateTime  // 근무 날짜
  startTime       String    // 시작 시간 (HH:mm)
  endTime         String    // 종료 시간 (HH:mm)
  
  // 인원 정보
  requiredCount   Int       @default(1)  // 필요 인원
  
  // 시급 정보
  hourlyWage      Int       // 시급
  
  // 메모
  description     String?   // 업무 설명
  
  // 관계
  store           Store     @relation(fields: [storeId], references: [id], onDelete: Cascade)
  applications    Application[]  // 신청 목록
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([storeId, date])
}
```

### 4. Application (알바 신청)
```prisma
model Application {
  id          String    @id @default(uuid())
  scheduleId  String
  userId      String
  
  // 신청 상태
  status      ApplicationStatus @default(PENDING)
  
  // 메모
  message     String?   // 신청 메시지
  rejectReason String?  // 거부 사유
  
  // 관계
  schedule    Schedule  @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // 처리 정보
  processedBy String?   // 처리한 관리자 ID
  processedAt DateTime? // 처리 시간
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  @@unique([scheduleId, userId])
  @@index([userId])
  @@index([scheduleId])
}

enum ApplicationStatus {
  PENDING   // 대기중
  APPROVED  // 승인됨
  REJECTED  // 거부됨
  CANCELLED // 취소됨
}
```

### 5. WorkRecord (근무 기록)
```prisma
model WorkRecord {
  id            String    @id @default(uuid())
  applicationId String    @unique
  
  // 실제 근무 시간
  actualStartTime DateTime?
  actualEndTime   DateTime?
  
  // 급여 정보
  totalHours      Float?    // 총 근무 시간
  totalWage       Int?      // 총 급여
  
  // 상태
  status          WorkStatus @default(SCHEDULED)
  
  // 메모
  note            String?
  
  // 관계
  application     Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

enum WorkStatus {
  SCHEDULED   // 예정됨
  IN_PROGRESS // 근무중
  COMPLETED   // 완료됨
  ABSENT      // 결근
}
```

---

## 🎯 API 엔드포인트 설계

### Store (업체) API

#### 업체 관리
```
POST   /api/stores              - 업체 생성 (ADMIN)
GET    /api/stores              - 업체 목록 조회
GET    /api/stores/:id          - 업체 상세 조회
PUT    /api/stores/:id          - 업체 정보 수정 (ADMIN, MANAGER)
DELETE /api/stores/:id          - 업체 삭제 (ADMIN)
```

#### 업체 관리자
```
POST   /api/stores/:id/managers - 관리자 추가 (ADMIN)
GET    /api/stores/:id/managers - 관리자 목록
DELETE /api/stores/:id/managers/:userId - 관리자 제거 (ADMIN)
```

### Schedule (일정) API

#### 일정 관리
```
POST   /api/schedules           - 일정 생성 (ADMIN, MANAGER)
GET    /api/schedules           - 일정 목록 (필터: storeId, date, status)
GET    /api/schedules/:id       - 일정 상세
PUT    /api/schedules/:id       - 일정 수정 (ADMIN, MANAGER)
DELETE /api/schedules/:id       - 일정 삭제 (ADMIN, MANAGER)
```

#### 일정 조회 필터
```
GET /api/schedules?storeId=xxx&startDate=2024-01-01&endDate=2024-01-31
GET /api/schedules?status=available  (신청 가능한 일정)
```

### Application (신청) API

#### 신청 관리
```
POST   /api/applications        - 알바 신청 (EMPLOYEE)
GET    /api/applications        - 신청 목록 (본인 또는 관리자)
GET    /api/applications/:id    - 신청 상세
PUT    /api/applications/:id/approve  - 신청 승인 (ADMIN, MANAGER)
PUT    /api/applications/:id/reject   - 신청 거부 (ADMIN, MANAGER)
DELETE /api/applications/:id    - 신청 취소 (본인)
```

#### 신청 현황
```
GET /api/schedules/:id/applications  - 특정 일정의 신청 목록
GET /api/users/:id/applications      - 특정 사용자의 신청 목록
```

### WorkRecord (근무 기록) API

```
POST   /api/work-records        - 근무 기록 생성
GET    /api/work-records        - 근무 기록 목록
PUT    /api/work-records/:id/start  - 출근 체크
PUT    /api/work-records/:id/end    - 퇴근 체크
GET    /api/work-records/salary     - 급여 조회 (월별, 사용자별)
```

---

## 💼 주요 비즈니스 로직

### 1. 일정 생성 시
```typescript
// 검증
- 시작 시간 < 종료 시간
- 필요 인원 > 0
- 시급 >= 최저시급
- 관리자 권한 확인 (해당 업체의 관리자인지)
```

### 2. 알바 신청 시
```typescript
// 검증
- 일정이 아직 시작되지 않음
- 현재 승인된 인원 < 필요 인원
- 중복 신청 방지
- 시간 충돌 확인 (같은 시간대에 다른 일정 신청 여부)

// 처리
- 신청 생성 (PENDING 상태)
- 알림 발송 (관리자에게)
```

### 3. 신청 승인 시
```typescript
// 검증
- 관리자 권한 확인
- 정원 확인 (승인 시 정원 초과하지 않는지)
- 신청 상태가 PENDING인지

// 처리
- 상태를 APPROVED로 변경
- WorkRecord 생성
- 알림 발송 (신청자에게)
```

### 4. 급여 계산
```typescript
// 계산식
총 급여 = (종료시간 - 시작시간) × 시급

// 추가 고려사항
- 야간 수당 (22:00-06:00)
- 주휴 수당
- 주말/공휴일 수당
```

---

## 🎨 UI/UX 화면 구성

### 1. 관리자 화면

#### 업체 관리 페이지
- 업체 목록 (카드 형태)
- 업체 추가/수정/삭제
- 관리자 지정

#### 일정 관리 페이지
- 캘린더 뷰 (월간/주간/일간)
- 일정 생성 모달
  - 날짜 선택
  - 시간 선택 (시작/종료)
  - 필요 인원
  - 시급 설정
  - 업무 설명
- 일정 목록 (테이블 형태)
  - 필터: 업체, 날짜, 상태
  - 신청 현황 표시 (3/5명)

#### 신청 관리 페이지
- 신청 목록 (대기/승인/거부)
- 신청 상세 정보
- 승인/거부 버튼
- 신청자 정보

### 2. 직원 화면

#### 일정 조회 페이지
- 캘린더 뷰
- 신청 가능한 일정 표시
- 필터: 업체, 날짜
- 일정 상세 정보
  - 시간, 시급, 남은 자리

#### 신청 페이지
- 일정 선택
- 신청 메시지 입력
- 신청하기 버튼

#### 내 신청 내역
- 신청 목록 (대기/승인/거부)
- 상태별 필터
- 취소 기능

#### 근무 기록
- 예정된 근무
- 완료된 근무
- 급여 조회 (월별)

---

## 📱 알림 기능

### 알림 종류
1. **신청 접수** (관리자에게)
   - "새로운 알바 신청이 있습니다"
   
2. **신청 승인** (직원에게)
   - "신청이 승인되었습니다"
   
3. **신청 거부** (직원에게)
   - "신청이 거부되었습니다: [사유]"
   
4. **근무 시작 알림** (직원에게)
   - "1시간 후 근무가 시작됩니다"
   
5. **정원 마감** (관리자에게)
   - "일정의 정원이 마감되었습니다"

---

## 🔐 권한 관리

### 역할별 권한

#### ADMIN (관리자)
- 모든 업체 관리
- 모든 일정 생성/수정/삭제
- 모든 신청 승인/거부
- 관리자 지정
- 급여 조회

#### MANAGER (매니저)
- 담당 업체 관리
- 담당 업체 일정 생성/수정/삭제
- 담당 업체 신청 승인/거부
- 급여 조회

#### EMPLOYEE (직원)
- 일정 조회
- 알바 신청
- 본인 신청 취소
- 본인 근무 기록 조회
- 본인 급여 조회

---

## 📊 통계 및 리포트

### 관리자용 대시보드
1. **업체별 통계**
   - 총 일정 수
   - 총 신청 수
   - 승인율
   
2. **직원별 통계**
   - 총 근무 시간
   - 총 급여
   - 출석률
   
3. **월별 리포트**
   - 총 근무 시간
   - 총 급여 지출
   - 인기 시간대

### 직원용 대시보드
1. **이번 달 근무**
   - 예정된 근무
   - 완료된 근무
   - 예상 급여
   
2. **신청 현황**
   - 대기중
   - 승인됨
   - 거부됨

---

## 🚀 개발 우선순위

### Phase 1 (기본 기능)
1. ✅ 사용자 인증 시스템
2. 업체(Store) CRUD
3. 일정(Schedule) CRUD
4. 신청(Application) 기본 기능

### Phase 2 (핵심 기능)
1. 신청 승인/거부 프로세스
2. 정원 관리
3. 캘린더 UI
4. 필터 및 검색

### Phase 3 (고급 기능)
1. 근무 기록 관리
2. 급여 계산
3. 알림 시스템
4. 통계 대시보드

### Phase 4 (추가 기능)
1. 반복 일정 생성
2. 엑셀 내보내기
3. 모바일 앱
4. 실시간 알림 (WebSocket)

---

## 🛠️ 기술 스택

### Backend
- Node.js + Express
- Prisma ORM
- PostgreSQL
- JWT 인증

### Frontend
- React + TypeScript
- Zustand (상태 관리)
- React Router
- TailwindCSS
- FullCalendar (캘린더)
- React Query (데이터 페칭)

### 추가 라이브러리
- date-fns (날짜 처리)
- react-hook-form (폼 관리)
- zod (유효성 검사)
- recharts (차트)
