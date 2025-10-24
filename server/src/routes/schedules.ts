import express from 'express';
import { PrismaClient, User } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * 1. 일정 목록 조회
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { storeId, startDate, endDate, status } = req.query;

    const where: any = {};

    // 업체 필터
    if (storeId) {
      where.storeId = storeId as string;
    }

    // 날짜 필터
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.date.lte = new Date(endDate as string);
      }
    }

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        store: {
          select: {
            id: true,
            name: true,
          },
        },
        applications: {
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
            applications: true,
          },
        },
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' },
      ],
    });

    // 신청 가능 여부 추가
    const schedulesWithStatus = schedules.map(schedule => {
      const approvedCount = schedule.applications.filter(
        app => app.status === 'APPROVED'
      ).length;
      
      return {
        ...schedule,
        approvedCount,
        isAvailable: approvedCount < schedule.requiredCount,
        remainingSlots: schedule.requiredCount - approvedCount,
      };
    });

    // status 필터 (신청 가능한 일정만)
    if (status === 'available') {
      const availableSchedules = schedulesWithStatus.filter(s => s.isAvailable);
      return res.json(availableSchedules);
    }

    res.json(schedulesWithStatus);
  } catch (error) {
    console.error('일정 목록 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * 2. 일정 상세 조회
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const schedule = await prisma.schedule.findUnique({
      where: { id },
      include: {
        store: true,
        applications: {
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
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!schedule) {
      return res.status(404).json({ message: '일정을 찾을 수 없습니다.' });
    }

    const approvedCount = schedule.applications.filter(
      app => app.status === 'APPROVED'
    ).length;

    res.json({
      ...schedule,
      approvedCount,
      isAvailable: approvedCount < schedule.requiredCount,
      remainingSlots: schedule.requiredCount - approvedCount,
    });
  } catch (error) {
    console.error('일정 상세 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * 3. 일정 생성 (ADMIN, MANAGER만 가능)
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const user = req.user as User;
    const { storeId, date, startTime, endTime, requiredCount, hourlyWage, description } = req.body;

    // 입력 검증
    if (!storeId || !date || !startTime || !endTime || !requiredCount || !hourlyWage) {
      return res.status(400).json({ message: '필수 필드를 모두 입력해주세요.' });
    }

    // 권한 확인
    if (user.role === 'MANAGER') {
      const isManager = await prisma.storeManager.findUnique({
        where: {
          storeId_userId: {
            storeId,
            userId: user.id,
          },
        },
      });

      if (!isManager) {
        return res.status(403).json({ message: '해당 업체의 관리자가 아닙니다.' });
      }
    } else if (user.role !== 'ADMIN') {
      return res.status(403).json({ message: '권한이 없습니다.' });
    }

    // 시간 검증
    if (startTime >= endTime) {
      return res.status(400).json({ message: '시작 시간은 종료 시간보다 빨라야 합니다.' });
    }

    // 필요 인원 검증
    if (requiredCount < 1) {
      return res.status(400).json({ message: '필요 인원은 1명 이상이어야 합니다.' });
    }

    // 시급 검증 (최저시급)
    if (hourlyWage < 9860) {
      return res.status(400).json({ message: '시급은 최저시급 이상이어야 합니다.' });
    }

    const schedule = await prisma.schedule.create({
      data: {
        storeId,
        date: new Date(date),
        startTime,
        endTime,
        requiredCount,
        hourlyWage,
        description,
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
          },
        },
        applications: {
          select: { status: true },
        },
      },
    });

    const approvedCount = schedule.applications.filter(app => app.status === 'APPROVED').length;

    res.status(201).json({
      ...schedule,
      approvedCount,
      isAvailable: approvedCount < schedule.requiredCount,
      remainingSlots: schedule.requiredCount - approvedCount,
    });
  } catch (error) {
    console.error('일정 생성 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * 4. 일정 수정 (ADMIN, 해당 업체 MANAGER만 가능)
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const user = req.user as User;
    const { id } = req.params;
    const { date, startTime, endTime, requiredCount, hourlyWage, description } = req.body;

    // 일정 조회
    const existingSchedule = await prisma.schedule.findUnique({
      where: { id },
    });

    if (!existingSchedule) {
      return res.status(404).json({ message: '일정을 찾을 수 없습니다.' });
    }

    // 권한 확인
    if (user.role === 'MANAGER') {
      const isManager = await prisma.storeManager.findUnique({
        where: {
          storeId_userId: {
            storeId: existingSchedule.storeId,
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

    // 시간 검증
    if (startTime && endTime && startTime >= endTime) {
      return res.status(400).json({ message: '시작 시간은 종료 시간보다 빨라야 합니다.' });
    }

    const schedule = await prisma.schedule.update({
      where: { id },
      data: {
        date: date ? new Date(date) : undefined,
        startTime,
        endTime,
        requiredCount,
        hourlyWage,
        description,
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json(schedule);
  } catch (error) {
    console.error('일정 수정 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * 5. 일정 삭제 (ADMIN, 해당 업체 MANAGER만 가능)
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const user = req.user as User;
    const { id } = req.params;

    // 일정 조회
    const existingSchedule = await prisma.schedule.findUnique({
      where: { id },
      include: {
        applications: true,
      },
    });

    if (!existingSchedule) {
      return res.status(404).json({ message: '일정을 찾을 수 없습니다.' });
    }

    // 권한 확인
    if (user.role === 'MANAGER') {
      const isManager = await prisma.storeManager.findUnique({
        where: {
          storeId_userId: {
            storeId: existingSchedule.storeId,
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

    // 승인된 신청이 있는지 확인
    const hasApprovedApplications = existingSchedule.applications.some(
      app => app.status === 'APPROVED'
    );

    if (hasApprovedApplications) {
      return res.status(400).json({ 
        message: '승인된 신청이 있는 일정은 삭제할 수 없습니다.' 
      });
    }

    await prisma.schedule.delete({
      where: { id },
    });

    res.json({ message: '일정이 삭제되었습니다.' });
  } catch (error) {
    console.error('일정 삭제 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

export default router;
