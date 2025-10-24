import express from 'express';
import passport from 'passport';
import bcrypt from 'bcrypt';
import { PrismaClient, User } from '@prisma/client';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
} from '../utils/jwt';
import { authenticate } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * 1. 회원가입
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;

    // 입력 검증
    if (!email || !password || !name || !phone) {
      return res.status(400).json({ message: '모든 필수 필드를 입력해주세요.' });
    }

    // 휴대폰 번호 형식 검증
    const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
    if (!phoneRegex.test(phone.replace(/-/g, ''))) {
      return res.status(400).json({ message: '올바른 휴대폰 번호 형식이 아닙니다. (010-1234-5678)' });
    }

    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ message: '이미 존재하는 이메일입니다.' });
    }

    // 휴대폰 번호 중복 확인
    const existingPhone = await prisma.user.findFirst({
      where: { phone },
    });

    if (existingPhone) {
      return res.status(409).json({ message: '이미 등록된 휴대폰 번호입니다.' });
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        provider: 'LOCAL',
      },
    });

    // 토큰 생성
    const accessToken = generateAccessToken(user.id);
    const refreshToken = await generateRefreshToken(user.id);

    // Refresh Token을 HttpOnly 쿠키로 설정
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
    });

    res.status(201).json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        profileImage: user.profileImage,
        provider: user.provider,
      },
    });
  } catch (error) {
    console.error('회원가입 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * 2. 로그인
 */
router.post('/login', (req, res, next) => {
  passport.authenticate('local', async (err: any, user: User | false, info: any) => {
    if (err) {
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }

    if (!user) {
      return res.status(401).json({ message: info.message || '로그인에 실패했습니다.' });
    }

    // 계정 차단 확인
    if (!user.isActive) {
      return res.status(403).json({ message: '차단된 계정입니다. 관리자에게 문의하세요.' });
    }

    try {
      // 토큰 생성
      const accessToken = generateAccessToken(user.id);
      const refreshToken = await generateRefreshToken(user.id);

      // Refresh Token을 HttpOnly 쿠키로 설정
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
          profileImage: user.profileImage,
          provider: user.provider,
        },
      });
    } catch (error) {
      console.error('로그인 토큰 생성 오류:', error);
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  })(req, res, next);
});

/**
 * 3. 카카오 로그인 시작
 */
router.get('/kakao', passport.authenticate('kakao'));

/**
 * 4. 카카오 로그인 콜백
 */
router.get(
  '/kakao/callback',
  (req, res, next) => {
    passport.authenticate('kakao', { session: false }, (err, user, info) => {
      if (err) {
        console.error('카카오 인증 오류:', err);
        return res.status(500).json({
          success: false,
          message: '카카오 인증 중 서버 오류가 발생했습니다.',
          error: err.message
        });
      }
      if (!user) {
        return res.status(401).json({
          success: false,
          message: '카카오 인증에 실패했습니다. 다시 시도해주세요.'
        });
      }
      req.user = user;
      next();
    })(req, res, next);
  },
  async (req, res) => {
    try {
      const user = req.user as User;

      // 토큰 생성
      const accessToken = generateAccessToken(user.id);
      const refreshToken = await generateRefreshToken(user.id);

      // Refresh Token을 HttpOnly 쿠키로 설정
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      // 프론트엔드로 리다이렉트 (토큰을 쿼리 파라미터로 전달)
      const clientURL = process.env.CLIENT_URL || 'http://localhost:5173';
      res.redirect(
        `${clientURL}/auth/callback?token=${encodeURIComponent(accessToken)}`
      );
    } catch (error) {
      console.error('카카오 콜백 처리 오류:', error);
      res.status(500).json({
        success: false,
        message: '카카오 로그인 처리 중 오류가 발생했습니다.'
      });
    }
  }
);

/**
 * 5. Access Token 갱신
 */
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh Token이 없습니다.' });
    }

    const user = await verifyRefreshToken(refreshToken);

    if (!user) {
      return res.status(401).json({ message: '유효하지 않은 Refresh Token입니다.' });
    }

    // 새로운 Access Token 발급
    const accessToken = generateAccessToken(user.id);

    res.json({ accessToken });
  } catch (error) {
    console.error('토큰 갱신 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * 6. 로그아웃
 */
router.post('/logout', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    res.clearCookie('refreshToken');
    res.json({ message: '로그아웃되었습니다.' });
  } catch (error) {
    console.error('로그아웃 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * 7. 모든 기기에서 로그아웃
 */
router.post('/logout-all', authenticate, async (req, res) => {
  try {
    const user = req.user as User;
    await revokeAllUserTokens(user.id);
    res.clearCookie('refreshToken');
    res.json({ message: '모든 기기에서 로그아웃되었습니다.' });
  } catch (error) {
    console.error('전체 로그아웃 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * 8. 현재 사용자 정보 조회
 */
router.get('/me', authenticate, (req, res) => {
  const user = req.user as User;
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    profileImage: user.profileImage,
    provider: user.provider,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  });
});

/**
 * 9. 비밀번호 변경
 */
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const user = req.user as User;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: '모든 필드를 입력해주세요.' });
    }

    // 로컬 로그인 사용자만 가능
    if (user.provider !== 'LOCAL' || !user.password) {
      return res.status(400).json({ message: '소셜 로그인 사용자는 비밀번호를 변경할 수 없습니다.' });
    }

    // 기존 비밀번호 확인
    const isValidPassword = await bcrypt.compare(oldPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: '기존 비밀번호가 일치하지 않습니다.' });
    }

    // 새 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 비밀번호 업데이트
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    res.json({ message: '비밀번호가 변경되었습니다.' });
  } catch (error) {
    console.error('비밀번호 변경 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

export default router;
