import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import passport from './config/passport';
import authRoutes from './routes/auth';
import storeRoutes from './routes/stores';
import scheduleRoutes from './routes/schedules';
import publicScheduleRoutes from './routes/publicSchedules';
import applicationRoutes from './routes/applications';
import userRoutes from './routes/users';

// 환경 변수 로드
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 보안 미들웨어
app.use(helmet());

// CORS 설정
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true, // 쿠키 전송 허용
  })
);

// Rate Limiting (무차별 대입 공격 방지)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // IP당 최대 100개 요청
  message: '너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해주세요.',
});

app.use('/api/auth', limiter);

// 로그인 엔드포인트에 더 엄격한 제한
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 15분당 5번
  message: '로그인 시도 횟수를 초과했습니다. 15분 후 다시 시도해주세요.',
});

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie Parser
app.use(cookieParser());

// Passport 초기화
app.use(passport.initialize());

// 라우트
app.use('/api/auth', authRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/public/schedules', publicScheduleRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/users', userRoutes);

// 로그인 엔드포인트에 Rate Limiting 적용
app.post('/api/auth/login', loginLimiter);
app.post('/api/auth/register', loginLimiter);

// 헬스 체크
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// 루트 경로
app.get('/', (_req, res) => {
  res.json({
    message: 'PostFNB Alba API Server',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      stores: '/api/stores',
      schedules: '/api/schedules',
      applications: '/api/applications',
      users: '/api/users',
      health: '/health',
    },
  });
});

// 404 에러 핸들러
app.use((_req, res) => {
  res.status(404).json({ message: '요청한 리소스를 찾을 수 없습니다.' });
});

// 전역 에러 핸들러
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('서버 오류:', err);
  res.status(err.status || 500).json({
    message: err.message || '서버 오류가 발생했습니다.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📍 API: http://localhost:${PORT}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  console.log(`🌍 환경: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
