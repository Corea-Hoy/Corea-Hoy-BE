import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface JwtPayload {
  sub?: string;
  userId?: string;
  email: string;
  role?: 'USER' | 'ADMIN';
  name?: string;
  picture?: string;
  image?: string;
}

// Request 타입에 user 필드 추가 (TypeScript 타입 확장)
declare global {
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
    // NextAuth 비밀키를 우선 사용하고, 없으면 기본 JWT_SECRET 사용
    const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET!;
    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
  }
}

// 관리자 전용 API에 authMiddleware 다음에 붙이는 미들웨어
export function adminMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ message: '관리자만 접근 가능합니다.' });
    return;
  }
  next();
}
