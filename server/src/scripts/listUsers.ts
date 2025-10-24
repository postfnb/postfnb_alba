/**
 * 사용자 목록 조회 스크립트
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📋 가입 사용자 목록을 조회합니다...\n');

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      provider: true,
      createdAt: true,
      lastLoginAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (users.length === 0) {
    console.log('❌ 등록된 사용자가 없습니다.');
    return;
  }

  console.log(`✅ 총 ${users.length}명의 사용자가 등록되어 있습니다.\n`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  users.forEach((user, index) => {
    console.log(`\n[${index + 1}] ${user.name} (${user.role})`);
    console.log(`    이메일: ${user.email || '없음'}`);
    console.log(`    전화번호: ${user.phone}`);
    console.log(`    로그인 방식: ${user.provider}`);
    console.log(`    가입일: ${user.createdAt.toLocaleString('ko-KR')}`);
    console.log(`    마지막 로그인: ${user.lastLoginAt ? user.lastLoginAt.toLocaleString('ko-KR') : '없음'}`);
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ 오류:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
