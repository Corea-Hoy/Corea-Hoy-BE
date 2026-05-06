import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface JwtPayload {
  userId: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

// Request 타입에 user 필드 추가 (TypeScript 타입 확장)
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// 로그인 필요한 API에 붙이는 미들웨어
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: '인증 토큰이 없습니다.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET || 'fallback-secret';
    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
  }
}

// 선택적 인증 미들웨어 (토큰 있으면 req.user 세팅, 없어도 통과)
export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    try {
      const secret = process.env.JWT_SECRET || 'fallback-secret';
      const decoded = jwt.verify(authHeader.split(' ')[1], secret) as JwtPayload;
      req.user = decoded;
    } catch {
      // 유효하지 않은 토큰이면 req.user 미설정 후 계속 진행
    }
  }
  next();
}

// 관리자 전용 API에 authMiddleware 다음에 붙이는 미들웨어
export function adminMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ message: '관리자만 접근 가능합니다.' });
    return;
  }
  next();
}
