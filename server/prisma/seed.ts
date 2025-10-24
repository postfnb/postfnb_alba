/**
 * 데이터베이스 시드 스크립트
 * 개발/테스트용 초기 데이터를 생성합니다.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 시드 데이터를 생성하고 있습니다...');

  // 관리자 계정 생성
  const adminPassword = await bcrypt.hash('admin123!', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@postfnb.com' },
    update: {},
    create: {
      email: 'admin@postfnb.com',
      password: adminPassword,
      name: '관리자',
      phone: '010-1234-5678',
      role: 'ADMIN',
      provider: 'LOCAL',
    },
  });

  console.log('✅ 관리자 계정 생성:', admin.email);

  // 매니저 계정 생성
  const managerPassword = await bcrypt.hash('manager123!', 10);
  const manager = await prisma.user.upsert({
    where: { email: 'manager@postfnb.com' },
    update: {},
    create: {
      email: 'manager@postfnb.com',
      password: managerPassword,
      name: '매니저',
      phone: '010-2345-6789',
      role: 'MANAGER',
      provider: 'LOCAL',
    },
  });

  console.log('✅ 매니저 계정 생성:', manager.email);

  // 직원 계정 생성
  const employeePassword = await bcrypt.hash('employee123!', 10);
  const employee = await prisma.user.upsert({
    where: { email: 'employee@postfnb.com' },
    update: {},
    create: {
      email: 'employee@postfnb.com',
      password: employeePassword,
      name: '아르바이트생',
      phone: '010-3456-7890',
      role: 'EMPLOYEE',
      provider: 'LOCAL',
    },
  });

  console.log('✅ 직원 계정 생성:', employee.email);

  console.log('\n📋 테스트 계정 정보:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('관리자:');
  console.log('  이메일: admin@postfnb.com');
  console.log('  비밀번호: admin123!');
  console.log('');
  console.log('매니저:');
  console.log('  이메일: manager@postfnb.com');
  console.log('  비밀번호: manager123!');
  console.log('');
  console.log('직원:');
  console.log('  이메일: employee@postfnb.com');
  console.log('  비밀번호: employee123!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ 시드 오류:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
