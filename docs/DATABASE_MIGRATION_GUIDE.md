# 데이터베이스 마이그레이션 가이드

## 📋 새로 추가된 테이블

### 1. Store (업체/지점)
- 여러 업체 관리
- 기본 시급 설정
- 업체별 관리자 지정

### 2. StoreManager (업체 관리자)
- 사용자와 업체의 다대다 관계
- 업체별 관리자 권한 부여

### 3. Schedule (근무 일정)
- 날짜별, 시간별 일정
- 필요 인원 수 설정
- 시급 정보

### 4. Application (알바 신청)
- 직원의 일정 신청
- 승인/거부 상태 관리
- 신청 메시지 및 거부 사유

### 5. WorkRecord (근무 기록)
- 실제 근무 시간 기록
- 급여 계산
- 출퇴근 체크

## 🚀 마이그레이션 실행 방법

### 1단계: Prisma 클라이언트 생성
```bash
cd server
npm run prisma:generate
```

### 2단계: 마이그레이션 생성 및 실행
```bash
npm run prisma:migrate
```

마이그레이션 이름 입력 예시:
```
add_alba_management_tables
```

### 3단계: 마이그레이션 확인
```bash
npx prisma migrate status
```

## 📊 초기 데이터 생성

### 테스트용 업체 생성 스크립트

`server/prisma/seed-stores.ts` 파일을 생성하세요:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🏪 업체 시드 데이터를 생성합니다...');

  // 업체 1: 강남점
  const store1 = await prisma.store.upsert({
    where: { id: 'store-gangnam' },
    update: {},
    create: {
      id: 'store-gangnam',
      name: 'PostFNB 강남점',
      address: '서울시 강남구 테헤란로 123',
      phone: '02-1234-5678',
      description: '강남역 인근 매장',
      baseHourlyWage: 10000,
    },
  });

  // 업체 2: 홍대점
  const store2 = await prisma.store.upsert({
    where: { id: 'store-hongdae' },
    update: {},
    create: {
      id: 'store-hongdae',
      name: 'PostFNB 홍대점',
      address: '서울시 마포구 양화로 456',
      phone: '02-2345-6789',
      description: '홍대입구역 인근 매장',
      baseHourlyWage: 10500,
    },
  });

  console.log('✅ 업체 생성 완료:', store1.name, store2.name);

  // 관리자를 업체 관리자로 지정
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@postfnb.com' },
  });

  if (admin) {
    await prisma.storeManager.upsert({
      where: {
        storeId_userId: {
          storeId: store1.id,
          userId: admin.id,
        },
      },
      update: {},
      create: {
        storeId: store1.id,
        userId: admin.id,
      },
    });

    await prisma.storeManager.upsert({
      where: {
        storeId_userId: {
          storeId: store2.id,
          userId: admin.id,
        },
      },
      update: {},
      create: {
        storeId: store2.id,
        userId: admin.id,
      },
    });

    console.log('✅ 관리자 지정 완료');
  }

  // 샘플 일정 생성
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const schedule1 = await prisma.schedule.create({
    data: {
      storeId: store1.id,
      date: tomorrow,
      startTime: '09:00',
      endTime: '18:00',
      requiredCount: 3,
      hourlyWage: 10000,
      description: '주간 근무 (9시-6시)',
    },
  });

  const schedule2 = await prisma.schedule.create({
    data: {
      storeId: store1.id,
      date: tomorrow,
      startTime: '18:00',
      endTime: '22:00',
      requiredCount: 2,
      hourlyWage: 12000,
      description: '야간 근무 (6시-10시)',
    },
  });

  console.log('✅ 샘플 일정 생성 완료');
  console.log('  -', schedule1.description);
  console.log('  -', schedule2.description);
}

main()
  .catch((e) => {
    console.error('❌ 시드 오류:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### 시드 스크립트 실행
```bash
npx ts-node prisma/seed-stores.ts
```

## 🔍 데이터 확인

### pgAdmin에서 확인
```sql
-- 업체 목록
SELECT * FROM "Store";

-- 업체별 관리자
SELECT 
    s.name as store_name,
    u.name as manager_name,
    u.email
FROM "StoreManager" sm
JOIN "Store" s ON sm."storeId" = s.id
JOIN "User" u ON sm."userId" = u.id;

-- 일정 목록
SELECT 
    s.name as store_name,
    sc.date,
    sc."startTime",
    sc."endTime",
    sc."requiredCount",
    sc."hourlyWage"
FROM "Schedule" sc
JOIN "Store" s ON sc."storeId" = s.id
ORDER BY sc.date, sc."startTime";
```

### 명령어로 확인
```bash
# 업체 목록 조회 스크립트 실행
npx ts-node src/scripts/listStores.ts
```

## 📝 마이그레이션 롤백 (필요시)

### 마지막 마이그레이션 취소
```bash
npx prisma migrate reset
```

⚠️ **주의**: 이 명령은 모든 데이터를 삭제합니다!

### 특정 마이그레이션으로 롤백
```bash
npx prisma migrate resolve --rolled-back "마이그레이션_이름"
```

## 🔧 문제 해결

### 마이그레이션 충돌
```bash
# 마이그레이션 상태 확인
npx prisma migrate status

# 마이그레이션 재설정
npx prisma migrate reset

# 다시 마이그레이션
npx prisma migrate dev
```

### Prisma Client 동기화
```bash
# Prisma Client 재생성
npx prisma generate
```

## 📚 다음 단계

1. ✅ 데이터베이스 마이그레이션
2. ✅ 시드 데이터 생성
3. 🔄 API 엔드포인트 개발
4. 🔄 프론트엔드 UI 개발
5. 🔄 테스트 및 배포

## 🎯 개발 순서

### Phase 1: 업체 관리
- [ ] Store CRUD API
- [ ] StoreManager API
- [ ] 업체 관리 UI

### Phase 2: 일정 관리
- [ ] Schedule CRUD API
- [ ] 캘린더 UI
- [ ] 일정 생성/수정 폼

### Phase 3: 신청 관리
- [ ] Application API
- [ ] 신청 목록 UI
- [ ] 승인/거부 기능

### Phase 4: 근무 기록
- [ ] WorkRecord API
- [ ] 출퇴근 체크 UI
- [ ] 급여 계산 및 조회
