/**
 * 업체 및 일정 시드 데이터 생성 스크립트
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🏪 업체 시드 데이터를 생성합니다...\n');

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

  console.log('✅ 업체 생성:', store1.name);

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

  console.log('✅ 업체 생성:', store2.name);

  // 업체 3: 신촌점
  const store3 = await prisma.store.upsert({
    where: { id: 'store-sinchon' },
    update: {},
    create: {
      id: 'store-sinchon',
      name: 'PostFNB 신촌점',
      address: '서울시 서대문구 신촌로 789',
      phone: '02-3456-7890',
      description: '신촌역 인근 매장',
      baseHourlyWage: 10000,
    },
  });

  console.log('✅ 업체 생성:', store3.name);

  // 관리자를 업체 관리자로 지정
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@postfnb.com' },
  });

  const manager = await prisma.user.findUnique({
    where: { email: 'manager@postfnb.com' },
  });

  if (admin) {
    // 관리자는 모든 업체 관리
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

    await prisma.storeManager.upsert({
      where: {
        storeId_userId: {
          storeId: store3.id,
          userId: admin.id,
        },
      },
      update: {},
      create: {
        storeId: store3.id,
        userId: admin.id,
      },
    });

    console.log('✅ 관리자 지정 완료:', admin.name);
  }

  if (manager) {
    // 매니저는 강남점만 관리
    await prisma.storeManager.upsert({
      where: {
        storeId_userId: {
          storeId: store1.id,
          userId: manager.id,
        },
      },
      update: {},
      create: {
        storeId: store1.id,
        userId: manager.id,
      },
    });

    console.log('✅ 매니저 지정 완료:', manager.name);
  }

  // 샘플 일정 생성
  console.log('\n📅 샘플 일정을 생성합니다...');

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  dayAfterTomorrow.setHours(0, 0, 0, 0);

  // 강남점 일정
  const schedules = [
    // 내일 일정
    {
      storeId: store1.id,
      date: tomorrow,
      startTime: '09:00',
      endTime: '13:00',
      requiredCount: 2,
      hourlyWage: 10000,
      description: '오전 근무 (주방 보조)',
    },
    {
      storeId: store1.id,
      date: tomorrow,
      startTime: '13:00',
      endTime: '18:00',
      requiredCount: 3,
      hourlyWage: 10000,
      description: '오후 근무 (홀 서빙)',
    },
    {
      storeId: store1.id,
      date: tomorrow,
      startTime: '18:00',
      endTime: '22:00',
      requiredCount: 2,
      hourlyWage: 12000,
      description: '저녁 근무 (야간 수당 포함)',
    },
    // 모레 일정
    {
      storeId: store1.id,
      date: dayAfterTomorrow,
      startTime: '09:00',
      endTime: '18:00',
      requiredCount: 4,
      hourlyWage: 10000,
      description: '주간 근무 (풀타임)',
    },
    // 홍대점 일정
    {
      storeId: store2.id,
      date: tomorrow,
      startTime: '10:00',
      endTime: '14:00',
      requiredCount: 2,
      hourlyWage: 10500,
      description: '점심 시간대 근무',
    },
    {
      storeId: store2.id,
      date: tomorrow,
      startTime: '17:00',
      endTime: '21:00',
      requiredCount: 3,
      hourlyWage: 11000,
      description: '저녁 피크 시간대',
    },
    // 신촌점 일정
    {
      storeId: store3.id,
      date: tomorrow,
      startTime: '11:00',
      endTime: '15:00',
      requiredCount: 2,
      hourlyWage: 10000,
      description: '런치 타임',
    },
  ];

  for (const scheduleData of schedules) {
    const schedule = await prisma.schedule.create({
      data: scheduleData,
    });
    console.log(`  ✅ ${schedule.description} (${schedule.startTime}-${schedule.endTime})`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 생성된 데이터 요약:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`업체: ${3}개`);
  console.log(`일정: ${schedules.length}개`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ 시드 오류:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
