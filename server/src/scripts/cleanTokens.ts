/**
 * 만료된 Refresh Token을 정리하는 스크립트
 * Cron Job으로 실행하거나 수동으로 실행할 수 있습니다.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanExpiredTokens() {
  try {
    console.log('🧹 만료된 토큰을 정리하고 있습니다...');

    const result = await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    console.log(`✅ ${result.count}개의 만료된 토큰을 삭제했습니다.`);
  } catch (error) {
    console.error('❌ 토큰 정리 중 오류 발생:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
cleanExpiredTokens();
