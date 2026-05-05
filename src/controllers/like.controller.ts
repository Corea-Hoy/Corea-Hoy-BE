import { Request, Response, NextFunction } from 'express';
import * as likeService from '../services/like.service';

export const toggleLike = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: '인증이 필요합니다.' });
      return;
    }

    const result = await likeService.toggleLike(req.params.id as string, userId);

    if (!result) {
      res.status(404).json({ success: false, message: '기사를 찾을 수 없습니다.' });
      return;
    }

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
