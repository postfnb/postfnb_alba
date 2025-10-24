import express from 'express';
import { PrismaClient, User } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * 1. 업체 목록 조회
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const user = req.user as User;

    let stores;

    if (user.role === 'ADMIN') {
      // 관리자는 모든 업체 조회
      stores = await prisma.store.findMany({
        include: {
          managers: {
            include: {
              user: {
                select: {
                  id: true,
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
    } else if (user.role === 'MANAGER') {
      // 매니저는 자신이 관리하는 업체만 조회
      stores = await prisma.store.findMany({
        where: {
          managers: {
            some: {
              userId: user.id,
            },
          },
        },
        include: {
          managers: {
            include: {
              user: {
                select: {
                  id: true,
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
    } else {
      // 직원은 모든 업체 조회 가능 (신청을 위해)
      stores = await prisma.store.findMany({
        select: {
          id: true,
          name: true,
          address: true,
          phone: true,
          description: true,
          baseHourlyWage: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    res.json(stores);
  } catch (error) {
    console.error('업체 목록 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * 2. 업체 상세 조회
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const store = await prisma.store.findUnique({
      where: { id },
      include: {
        managers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
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
    });

    if (!store) {
      return res.status(404).json({ message: '업체를 찾을 수 없습니다.' });
    }

    res.json(store);
  } catch (error) {
    console.error('업체 상세 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * 3. 업체 생성 (ADMIN만 가능)
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const user = req.user as User;

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ message: '권한이 없습니다.' });
    }

    const { name, address, phone, description, baseHourlyWage } = req.body;

    // 입력 검증
    if (!name) {
      return res.status(400).json({ message: '업체명은 필수입니다.' });
    }

    const store = await prisma.store.create({
      data: {
        name,
        address,
        phone,
        description,
        baseHourlyWage: baseHourlyWage || 9860,
      },
    });

    res.status(201).json(store);
  } catch (error) {
    console.error('업체 생성 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * 4. 업체 수정 (ADMIN, 해당 업체 MANAGER만 가능)
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const user = req.user as User;
    const { id } = req.params;
    const { name, address, phone, description, baseHourlyWage } = req.body;

    // 권한 확인
    if (user.role === 'MANAGER') {
      const isManager = await prisma.storeManager.findUnique({
        where: {
          storeId_userId: {
            storeId: id,
            userId: user.id,
          },
        },
      });

      if (!isManager) {
        return res.status(403).json({ message: '권한이 없습니다.' });
      }
    } else if (user.role !== 'ADMIN') {
      return res.status(403).json({ message: '권한이 없습니다.' });
    }

    const store = await prisma.store.update({
      where: { id },
      data: {
        name,
        address,
        phone,
        description,
        baseHourlyWage,
      },
    });

    res.json(store);
  } catch (error) {
    console.error('업체 수정 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * 5. 업체 삭제 (ADMIN만 가능)
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const user = req.user as User;
    const { id } = req.params;

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ message: '권한이 없습니다.' });
    }

    await prisma.store.delete({
      where: { id },
    });

    res.json({ message: '업체가 삭제되었습니다.' });
  } catch (error) {
    console.error('업체 삭제 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * 6. 업체 관리자 추가 (ADMIN만 가능)
 */
router.post('/:id/managers', authenticate, async (req, res) => {
  try {
    const user = req.user as User;
    const { id } = req.params;
    const { userId } = req.body;

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ message: '권한이 없습니다.' });
    }

    if (!userId) {
      return res.status(400).json({ message: '사용자 ID는 필수입니다.' });
    }

    // 사용자 확인
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    // 이미 관리자인지 확인
    const existing = await prisma.storeManager.findUnique({
      where: {
        storeId_userId: {
          storeId: id,
          userId,
        },
      },
    });

    if (existing) {
      return res.status(409).json({ message: '이미 관리자로 등록되어 있습니다.' });
    }

    const storeManager = await prisma.storeManager.create({
      data: {
        storeId: id,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json(storeManager);
  } catch (error) {
    console.error('관리자 추가 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * 7. 업체 관리자 제거 (ADMIN만 가능)
 */
router.delete('/:id/managers/:userId', authenticate, async (req, res) => {
  try {
    const user = req.user as User;
    const { id, userId } = req.params;

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ message: '권한이 없습니다.' });
    }

    await prisma.storeManager.delete({
      where: {
        storeId_userId: {
          storeId: id,
          userId,
        },
      },
    });

    res.json({ message: '관리자가 제거되었습니다.' });
  } catch (error) {
    console.error('관리자 제거 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

export default router;
