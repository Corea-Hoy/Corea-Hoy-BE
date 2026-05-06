import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getArticles, getArticleById } from '../services/article.service';
import { JwtPayload } from '../middlewares/auth.middleware';

/**
 * 조회수 중복 방지용 viewerKey 추출
 * - 로그인 유저: userId
 * - 비로그인: 클라이언트 IP
 */
const extractViewerKey = (req: Request): string => {
  // 로그인 유저면 userId 우선
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const secret = process.env.JWT_SECRET || 'fallback-secret';
      const decoded = jwt.verify(authHeader.split(' ')[1], secret) as JwtPayload;
      return `user:${decoded.userId}`;
    } catch {
      // 토큰 유효하지 않으면 IP로 fallback
    }
  }

  // 비로그인: IP 추출 (프록시/로드밸런서 헤더 우선)
  const forwarded = req.headers['x-forwarded-for'];
  const ip =
    (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : undefined) ??
    req.socket.remoteAddress ??
    'unknown';

  return `ip:${ip}`;
};

export const getArticlesController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, q, sort } = req.query;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));

    const result = await getArticles({
      category: typeof category === 'string' ? category : undefined,
      q: typeof q === 'string' ? q : undefined,
      sort: typeof sort === 'string' ? sort : undefined,
      page,
      limit,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getArticleController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const viewerKey = extractViewerKey(req);
    const article = await getArticleById(req.params.id as string, viewerKey);

    if (!article) {
      res.status(404).json({ success: false, message: '기사를 찾을 수 없습니다.' });
      return;
    }

    res.json({ success: true, data: article });
  } catch (err) {
    next(err);
  }
};
