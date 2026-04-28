import { Request, Response, NextFunction } from 'express';
import { getArticles, getArticleById } from '../services/article.service';

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
    const article = await getArticleById(req.params.id as string);

    if (!article) {
      res.status(404).json({ success: false, message: '기사를 찾을 수 없습니다.' });
      return;
    }

    res.json({ success: true, data: article });
  } catch (err) {
    next(err);
  }
};
