/**
 * 관리자 비밀번호 재설정 스크립트
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 관리자 비밀번호를 재설정합니다...\n');

  const email = 'admin@postfnb.com';
  const newPassword = 'admin123!';

  // 관리자 계정 확인
  const admin = await prisma.user.findUnique({
    where: { email },
  });

  if (!admin) {
    console.log('❌ 관리자 계정을 찾을 수 없습니다.');
    console.log('새로운 관리자 계정을 생성합니다...\n');

    // 새 관리자 계정 생성
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const newAdmin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: '관리자',
        phone: '010-1234-5678',
        role: 'ADMIN',
        provider: 'LOCAL',
      },
    });

    console.log('✅ 새 관리자 계정이 생성되었습니다.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('이메일:', newAdmin.email);
    console.log('비밀번호:', newPassword);
    console.log('이름:', newAdmin.name);
    console.log('역할:', newAdmin.role);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    return;
  }

  // 비밀번호 해싱
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // 비밀번호 업데이트
  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });

  console.log('✅ 관리자 비밀번호가 재설정되었습니다.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('이메일:', admin.email);
  console.log('새 비밀번호:', newPassword);
  console.log('이름:', admin.name);
  console.log('역할:', admin.role);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('이제 다음 정보로 로그인할 수 있습니다:');
  console.log(`  이메일: ${email}`);
  console.log(`  비밀번호: ${newPassword}`);
}

main()
  .catch((e) => {
    console.error('❌ 오류:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
