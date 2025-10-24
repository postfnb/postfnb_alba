/**
 * 업체 목록 조회 스크립트
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🏪 업체 목록을 조회합니다...\n');

  const stores = await prisma.store.findMany({
    include: {
      managers: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
      _count: {
        select: {
          schedules: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (stores.length === 0) {
    console.log('❌ 등록된 업체가 없습니다.');
    return;
  }

  console.log(`✅ 총 ${stores.length}개의 업체가 등록되어 있습니다.\n`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  stores.forEach((store, index) => {
    console.log(`\n[${index + 1}] ${store.name}`);
    console.log(`    주소: ${store.address || '없음'}`);
    console.log(`    전화번호: ${store.phone || '없음'}`);
    console.log(`    기본 시급: ${store.baseHourlyWage.toLocaleString()}원`);
    console.log(`    일정 수: ${store._count.schedules}개`);
    
    if (store.managers.length > 0) {
      console.log(`    관리자:`);
      store.managers.forEach(manager => {
        console.log(`      - ${manager.user.name} (${manager.user.email})`);
      });
    } else {
      console.log(`    관리자: 없음`);
    }
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // 일정 조회
  console.log('\n📅 일정 목록을 조회합니다...\n');

  const schedules = await prisma.schedule.findMany({
    include: {
      store: {
        select: {
          name: true,
        },
      },
      applications: {
        where: {
          status: 'APPROVED',
        },
      },
    },
    orderBy: [
      { date: 'asc' },
      { startTime: 'asc' },
    ],
  });

  if (schedules.length === 0) {
    console.log('❌ 등록된 일정이 없습니다.');
    return;
  }

  console.log(`✅ 총 ${schedules.length}개의 일정이 등록되어 있습니다.\n`);

  schedules.forEach((schedule, index) => {
    const approvedCount = schedule.applications.length;
    const remainingSlots = schedule.requiredCount - approvedCount;
    const status = remainingSlots > 0 ? '🟢 신청 가능' : '🔴 마감';

    console.log(`[${index + 1}] ${schedule.store.name} - ${schedule.description}`);
    console.log(`    날짜: ${new Date(schedule.date).toLocaleDateString('ko-KR')}`);
    console.log(`    시간: ${schedule.startTime} - ${schedule.endTime}`);
    console.log(`    시급: ${schedule.hourlyWage.toLocaleString()}원`);
    console.log(`    인원: ${approvedCount}/${schedule.requiredCount}명 ${status}`);
    console.log('');
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ 오류:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
