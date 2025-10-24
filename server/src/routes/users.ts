import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth';
import bcrypt from 'bcrypt';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/users
 * 사용자 목록 조회 (ADMIN, MANAGER만 가능)
 */
router.get('/', authenticate, authorize('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { role, search } = req.query;

    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { email: { contains: search as string } },
        { phone: { contains: search as string } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        provider: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(users);
  } catch (error) {
    console.error('사용자 목록 조회 오류:', error);
    res.status(500).json({ message: '사용자 목록 조회에 실패했습니다.' });
  }
});

/**
 * GET /api/users/:id
 * 사용자 상세 조회 (ADMIN, MANAGER만 가능)
 */
router.get('/:id', authenticate, authorize('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        applications: {
          include: {
            schedule: {
              include: {
                store: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    // 비밀번호 제외
    const { password, ...userWithoutPassword } = user;

    res.json(userWithoutPassword);
  } catch (error) {
    console.error('사용자 상세 조회 오류:', error);
    res.status(500).json({ message: '사용자 상세 조회에 실패했습니다.' });
  }
});

/**
 * PUT /api/users/:id
 * 사용자 정보 수정 (ADMIN만 가능)
 */
router.put('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, role } = req.body;

    const updateData: any = {};
    
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (role) {
      if (!['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(role)) {
        return res.status(400).json({ message: '유효하지 않은 역할입니다.' });
      }
      updateData.role = role;
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        provider: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error('사용자 정보 수정 오류:', error);
    res.status(500).json({ message: '사용자 정보 수정에 실패했습니다.' });
  }
});

/**
 * PUT /api/users/:id/role
 * 사용자 역할 변경 (ADMIN만 가능)
 */
router.put('/:id/role', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(role)) {
      return res.status(400).json({ message: '유효하지 않은 역할입니다.' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        provider: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error('사용자 역할 변경 오류:', error);
    res.status(500).json({ message: '사용자 역할 변경에 실패했습니다.' });
  }
});

/**
 * PUT /api/users/:id/block
 * 사용자 로그인 차단 (ADMIN만 가능)
 */
router.put('/:id/block', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    // 자기 자신은 차단할 수 없음
    if (req.user?.id === id) {
      return res.status(400).json({ message: '자기 자신은 차단할 수 없습니다.' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        provider: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // 해당 사용자의 모든 리프레시 토큰 삭제 (강제 로그아웃)
    await prisma.refreshToken.deleteMany({
      where: { userId: id },
    });

    res.json({ message: '사용자가 차단되었습니다.', user });
  } catch (error) {
    console.error('사용자 차단 오류:', error);
    res.status(500).json({ message: '사용자 차단에 실패했습니다.' });
  }
});

/**
 * PUT /api/users/:id/unblock
 * 사용자 로그인 차단 해제 (ADMIN만 가능)
 */
router.put('/:id/unblock', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.update({
      where: { id },
      data: { isActive: true },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        provider: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ message: '사용자 차단이 해제되었습니다.', user });
  } catch (error) {
    console.error('사용자 차단 해제 오류:', error);
    res.status(500).json({ message: '사용자 차단 해제에 실패했습니다.' });
  }
});

/**
 * PUT /api/users/:id/password
 * 사용자 패스워드 변경 (ADMIN만 가능)
 */
router.put('/:id/password', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    console.log('패스워드 변경 요청:', { userId: id, passwordLength: newPassword?.length });

    // 패스워드 유효성 검사
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: '패스워드는 최소 6자 이상이어야 합니다.' });
    }

    // 사용자 확인
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    // 소셜 로그인 사용자는 패스워드 변경 불가
    if (user.provider !== 'LOCAL') {
      return res.status(400).json({ 
        message: `${user.provider === 'KAKAO' ? '카카오' : '구글'} 로그인 사용자는 패스워드를 변경할 수 없습니다.` 
      });
    }

    // 패스워드 해싱
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 패스워드 업데이트
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    // 보안을 위해 해당 사용자의 모든 리프레시 토큰 삭제 (강제 재로그인)
    await prisma.refreshToken.deleteMany({
      where: { userId: id },
    });

    console.log('패스워드 변경 성공:', { userId: id, userName: user.name });
    res.json({ message: '패스워드가 변경되었습니다. 사용자는 새 패스워드로 다시 로그인해야 합니다.' });
  } catch (error) {
    console.error('패스워드 변경 오류:', error);
    res.status(500).json({ message: '패스워드 변경에 실패했습니다.' });
  }
});

/**
 * DELETE /api/users/:id
 * 사용자 삭제 (ADMIN만 가능)
 */
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    // 자기 자신은 삭제할 수 없음
    if (req.user?.id === id) {
      return res.status(400).json({ message: '자기 자신은 삭제할 수 없습니다.' });
    }

    await prisma.user.delete({
      where: { id },
    });

    res.json({ message: '사용자가 삭제되었습니다.' });
  } catch (error) {
    console.error('사용자 삭제 오류:', error);
    res.status(500).json({ message: '사용자 삭제에 실패했습니다.' });
  }
});

export default router;
