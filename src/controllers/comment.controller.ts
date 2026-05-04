import { Request, Response, NextFunction } from 'express';
import * as commentService from '../services/comment.service';

export const getComments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const comments = await commentService.getComments(req.params.id as string);
    res.json({ success: true, data: comments });
  } catch (err) {
    next(err);
  }
};

export const createComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { body } = req.body ?? {};
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: '인증이 필요합니다.' });
      return;
    }

    if (!body || typeof body !== 'string' || !body.trim()) {
      res.status(400).json({ success: false, message: '댓글 내용을 입력해주세요.' });
      return;
    }

    if (body.trim().length < 10) {
      res.status(400).json({ success: false, message: '댓글은 10자 이상 입력해주세요.' });
      return;
    }

    if (body.trim().length > 400) {
      res.status(400).json({ success: false, message: '댓글은 400자 이하로 입력해주세요.' });
      return;
    }

    const comment = await commentService.createComment(
      req.params.id as string,
      userId,
      body.trim(),
    );

    if (!comment) {
      res.status(404).json({ success: false, message: '기사를 찾을 수 없습니다.' });
      return;
    }

    res.status(201).json({ success: true, data: comment });
  } catch (err) {
    next(err);
  }
};

export const updateComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { body } = req.body ?? {};
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: '인증이 필요합니다.' });
      return;
    }

    if (!body || typeof body !== 'string' || !body.trim()) {
      res.status(400).json({ success: false, message: '댓글 내용을 입력해주세요.' });
      return;
    }

    if (body.trim().length < 10) {
      res.status(400).json({ success: false, message: '댓글은 10자 이상 입력해주세요.' });
      return;
    }

    if (body.trim().length > 400) {
      res.status(400).json({ success: false, message: '댓글은 400자 이하로 입력해주세요.' });
      return;
    }

    const result = await commentService.updateComment(req.params.id as string, userId, body.trim());

    if (!result) {
      res.status(404).json({ success: false, message: '댓글을 찾을 수 없습니다.' });
      return;
    }

    if (result === 'forbidden') {
      res.status(403).json({ success: false, message: '본인 댓글만 수정할 수 있습니다.' });
      return;
    }

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const deleteComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: '인증이 필요합니다.' });
      return;
    }

    const result = await commentService.deleteComment(req.params.id as string, userId);

    if (!result) {
      res.status(404).json({ success: false, message: '댓글을 찾을 수 없습니다.' });
      return;
    }

    if (result === 'forbidden') {
      res.status(403).json({ success: false, message: '본인 댓글만 삭제할 수 있습니다.' });
      return;
    }

    res.json({ success: true, message: '댓글이 삭제되었습니다.' });
  } catch (err) {
    next(err);
  }
};
