import { Request, Response, NextFunction } from 'express';
import { getArticles, getArticleById } from '../services/article.service';

/** 조회수 중복 방지용 viewerKey 생성 (optionalAuthMiddleware 실행 후 호출) */
const buildViewerKey = (req: Request): string => {
  if (req.user?.userId) {
    return `user:${req.user.userId}`;
  }

  const forwarded = req.headers['x-forwarded-for'];
  const ip =
    (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : undefined) ??
    req.socket.remoteAddress ??
    'unknown';

  // 날짜 포함: 하루 단위로 중복 방지 (DHCP/NAT IP 재할당 대응)
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return `ip:${ip}:${today}`;
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
    const viewerKey = buildViewerKey(req);
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
