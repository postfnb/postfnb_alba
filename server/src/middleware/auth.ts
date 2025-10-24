import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { User as PrismaUser } from '@prisma/client';

// Express Request 타입 확장
declare global {
  namespace Express {
    interface User extends PrismaUser {}
  }
}

/**
 * JWT 인증 미들웨어
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('jwt', { session: false }, (err: any, user: PrismaUser | false) => {
    if (err) {
      return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }

    if (!user) {
      return res.status(401).json({ message: '인증이 필요합니다.' });
    }

    req.user = user;
    next();
  })(req, res, next);
};

/**
 * 역할 기반 권한 체크 미들웨어
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as PrismaUser;

    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ message: '권한이 없습니다.' });
    }

    next();
  };
};

/**
 * 선택적 인증 미들웨어 (인증 안 되어도 통과)
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('jwt', { session: false }, (err: any, user: PrismaUser | false) => {
    if (user) {
      req.user = user;
    }
    next();
  })(req, res, next);
};
