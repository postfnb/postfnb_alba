import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

const mapToPublicSchedule = (schedule: any) => {
  const approvedCount = schedule.applications.filter(
    (app: { status: string }) => app.status === 'APPROVED'
  ).length;

  return {
    id: schedule.id,
    storeId: schedule.storeId,
    date: schedule.date,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    requiredCount: schedule.requiredCount,
    hourlyWage: schedule.hourlyWage,
    description: schedule.description,
    createdAt: schedule.createdAt,
    updatedAt: schedule.updatedAt,
    store: schedule.store,
    applications: [],
    approvedCount,
    isAvailable: approvedCount < schedule.requiredCount,
    remainingSlots: Math.max(schedule.requiredCount - approvedCount, 0),
  };
};

router.get('/', async (req, res) => {
  try {
    const { storeId, startDate, endDate, status, includeClosed } = req.query;

    const where: any = {};

    if (storeId) {
      where.storeId = storeId as string;
    }

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
          select: {
            status: true,
          },
        },
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' },
      ],
    });

    const publicSchedules = schedules.map(mapToPublicSchedule);

    let filteredSchedules = publicSchedules;

    if (status === 'available') {
      filteredSchedules = filteredSchedules.filter(s => s.isAvailable);
    }

    if (!includeClosed || includeClosed === 'false') {
      filteredSchedules = filteredSchedules.filter(s => s.isAvailable);
    }

    res.json(filteredSchedules);
  } catch (error) {
    console.error('공개 일정 목록 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const schedule = await prisma.schedule.findUnique({
      where: { id },
      include: {
        store: {
          select: {
            id: true,
            name: true,
          },
        },
        applications: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!schedule) {
      return res.status(404).json({ message: '일정을 찾을 수 없습니다.' });
    }

    res.json(mapToPublicSchedule(schedule));
  } catch (error) {
    console.error('공개 일정 상세 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

export default router;
