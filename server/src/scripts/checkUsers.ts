import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 사용자 목록 확인 중...\n');

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  console.log(`총 ${users.length}명의 사용자가 있습니다.\n`);

  // 역할별 통계
  const stats = {
    ADMIN: users.filter(u => u.role === 'ADMIN').length,
    MANAGER: users.filter(u => u.role === 'MANAGER').length,
    EMPLOYEE: users.filter(u => u.role === 'EMPLOYEE').length,
  };

  console.log('📊 역할별 통계:');
  console.log(`  관리자 (ADMIN): ${stats.ADMIN}명`);
  console.log(`  매니저 (MANAGER): ${stats.MANAGER}명`);
  console.log(`  직원 (EMPLOYEE): ${stats.EMPLOYEE}명\n`);

  console.log('👥 사용자 목록:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name} (${user.email})`);
    console.log(`   역할: ${user.role}`);
    console.log(`   가입일: ${user.createdAt.toLocaleString('ko-KR')}`);
    console.log('');
  });
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ 오류:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
