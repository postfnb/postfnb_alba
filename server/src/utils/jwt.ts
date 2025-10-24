import jwt from 'jsonwebtoken';
import { PrismaClient, User } from '@prisma/client';

const prisma = new PrismaClient();

// Access Token 생성
export const generateAccessToken = (userId: string): string => {
  return jwt.sign(
    { sub: userId },
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as string }
  );
};

// Refresh Token 생성 및 DB 저장
export const generateRefreshToken = async (userId: string): Promise<string> => {
  const token = jwt.sign(
    { sub: userId },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as string }
  );

  // DB에 저장
  const decoded = jwt.decode(token) as jwt.JwtPayload;
  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt: new Date(decoded.exp! * 1000),
    },
  });

  return token;
};

// Refresh Token 검증
export const verifyRefreshToken = async (token: string): Promise<User | null> => {
  try {
    // JWT 검증
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as jwt.JwtPayload;

    // DB에서 토큰 확인
    const refreshToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!refreshToken || refreshToken.expiresAt < new Date()) {
      return null;
    }

    return refreshToken.user;
  } catch (error) {
    return null;
  }
};

// Refresh Token 삭제 (로그아웃)
export const revokeRefreshToken = async (token: string): Promise<void> => {
  try {
    await prisma.refreshToken.delete({
      where: { token },
    });
  } catch (error) {
    // 토큰이 없으면 무시
  }
};

// 사용자의 모든 Refresh Token 삭제 (모든 기기에서 로그아웃)
export const revokeAllUserTokens = async (userId: string): Promise<void> => {
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });
};

// 만료된 Refresh Token 정리 (Cron Job용)
export const cleanExpiredTokens = async (): Promise<void> => {
  await prisma.refreshToken.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
};
