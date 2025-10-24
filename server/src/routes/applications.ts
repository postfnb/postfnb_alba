import express from 'express';
import { PrismaClient, User } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * 1. 신청 목록 조회
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const user = req.user as User;
    const { scheduleId, status } = req.query;

    const where: any = {};

    // 직원은 본인의 신청만 조회
    if (user.role === 'EMPLOYEE') {
      where.userId = user.id;
    }

    // 일정 필터
    if (scheduleId) {
      where.scheduleId = scheduleId as string;
    }

    // 상태 필터
    if (status) {
      where.status = status as string;
    }

    const applications = await prisma.application.findMany({
      where,
      include: {
        schedule: {
          include: {
            store: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
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
        createdAt: 'desc',
      },
    });

    res.json(applications);
  } catch (error) {
    console.error('신청 목록 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * 2. 신청 상세 조회
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = req.user as User;
    const { id } = req.params;

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        schedule: {
          include: {
            store: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        workRecord: true,
      },
    });

    if (!application) {
      return res.status(404).json({ message: '신청을 찾을 수 없습니다.' });
    }

    // 직원은 본인의 신청만 조회 가능
    if (user.role === 'EMPLOYEE' && application.userId !== user.id) {
      return res.status(403).json({ message: '권한이 없습니다.' });
    }

    res.json(application);
  } catch (error) {
    console.error('신청 상세 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * 3. 알바 신청 (EMPLOYEE)
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const user = req.user as User;
    const { scheduleId, message } = req.body;

    if (!scheduleId) {
      return res.status(400).json({ message: '일정 ID는 필수입니다.' });
    }

    // 일정 조회
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        applications: {
          where: {
            status: 'APPROVED',
          },
        },
      },
    });

    if (!schedule) {
      return res.status(404).json({ message: '일정을 찾을 수 없습니다.' });
    }

    // 일정이 과거인지 확인
    const scheduleDate = new Date(schedule.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (scheduleDate < today) {
      return res.status(400).json({ message: '과거 일정에는 신청할 수 없습니다.' });
    }

    // 정원 확인
    const approvedCount = schedule.applications.length;
    if (approvedCount >= schedule.requiredCount) {
      return res.status(400).json({ message: '정원이 마감되었습니다.' });
    }

    // 중복 신청 확인
    const existingApplication = await prisma.application.findUnique({
      where: {
        scheduleId_userId: {
          scheduleId,
          userId: user.id,
        },
      },
    });

    if (existingApplication) {
      return res.status(409).json({ message: '이미 신청한 일정입니다.' });
    }

    // 시간 충돌 확인 (같은 날짜, 시간이 겹치는 승인된 신청이 있는지)
    const conflictingApplications = await prisma.application.findMany({
      where: {
        userId: user.id,
        status: 'APPROVED',
        schedule: {
          date: schedule.date,
        },
      },
      include: {
        schedule: true,
      },
    });

    for (const app of conflictingApplications) {
      const appSchedule = app.schedule;
      // 시간 겹침 체크
      if (
        (schedule.startTime < appSchedule.endTime && schedule.endTime > appSchedule.startTime)
      ) {
        return res.status(400).json({ 
          message: '같은 시간대에 이미 승인된 일정이 있습니다.' 
        });
      }
    }

    // 신청 생성
    const application = await prisma.application.create({
      data: {
        scheduleId,
        userId: user.id,
        message,
        status: 'PENDING',
      },
      include: {
        schedule: {
          include: {
            store: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json(application);
  } catch (error) {
    console.error('신청 생성 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * 4. 신청 승인 (ADMIN, MANAGER)
 */
router.put('/:id/approve', authenticate, async (req, res) => {
  try {
    const user = req.user as User;
    const { id } = req.params;

    // 신청 조회
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        schedule: {
          include: {
            applications: {
              where: {
                status: 'APPROVED',
              },
            },
          },
        },
      },
    });

    if (!application) {
      return res.status(404).json({ message: '신청을 찾을 수 없습니다.' });
    }

    // 권한 확인
    if (user.role === 'MANAGER') {
      const isManager = await prisma.storeManager.findUnique({
        where: {
          storeId_userId: {
            storeId: application.schedule.storeId,
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

    // 신청 상태 확인
    if (application.status !== 'PENDING') {
      return res.status(400).json({ message: '대기 중인 신청만 승인할 수 있습니다.' });
    }

    // 정원 확인
    const approvedCount = application.schedule.applications.length;
    if (approvedCount >= application.schedule.requiredCount) {
      return res.status(400).json({ message: '정원이 마감되었습니다.' });
    }

    // 신청 승인 및 근무 기록 생성
    const [updatedApplication] = await prisma.$transaction([
      prisma.application.update({
        where: { id },
        data: {
          status: 'APPROVED',
          processedBy: user.id,
          processedAt: new Date(),
        },
        include: {
          schedule: {
            include: {
              store: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.workRecord.create({
        data: {
          applicationId: id,
          status: 'SCHEDULED',
        },
      }),
    ]);

    res.json(updatedApplication);
  } catch (error) {
    console.error('신청 승인 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * 5. 신청 거부 (ADMIN, MANAGER)
 */
router.put('/:id/reject', authenticate, async (req, res) => {
  try {
    const user = req.user as User;
    const { id } = req.params;
    const { rejectReason } = req.body;

    // 신청 조회
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        schedule: true,
      },
    });

    if (!application) {
      return res.status(404).json({ message: '신청을 찾을 수 없습니다.' });
    }

    // 권한 확인
    if (user.role === 'MANAGER') {
      const isManager = await prisma.storeManager.findUnique({
        where: {
          storeId_userId: {
            storeId: application.schedule.storeId,
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

    // 신청 상태 확인
    if (application.status !== 'PENDING') {
      return res.status(400).json({ message: '대기 중인 신청만 거부할 수 있습니다.' });
    }

    const updatedApplication = await prisma.application.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectReason,
        processedBy: user.id,
        processedAt: new Date(),
      },
      include: {
        schedule: {
          include: {
            store: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json(updatedApplication);
  } catch (error) {
    console.error('신청 거부 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * 6. 신청 취소 (본인만 가능, PENDING 상태만)
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const user = req.user as User;
    const { id } = req.params;

    const application = await prisma.application.findUnique({
      where: { id },
    });

    if (!application) {
      return res.status(404).json({ message: '신청을 찾을 수 없습니다.' });
    }

    // 본인 확인
    if (application.userId !== user.id) {
      return res.status(403).json({ message: '본인의 신청만 취소할 수 있습니다.' });
    }

    // 상태 확인
    if (application.status !== 'PENDING') {
      return res.status(400).json({ message: '대기 중인 신청만 취소할 수 있습니다.' });
    }

    await prisma.application.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
    });

    res.json({ message: '신청이 취소되었습니다.' });
  } catch (error) {
    console.error('신청 취소 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

export default router;
