import { Request, Response, NextFunction } from 'express';
import { FeedbackCategory } from '@prisma/client';
import { createFeedback } from '../services/feedback.service';

const VALID_CATEGORIES = Object.values(FeedbackCategory);

export const submitFeedback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, otherCategory, body, email } = req.body ?? {};

    // 타입 + 필수 값 검증
    if (typeof category !== 'string' || typeof body !== 'string' || !category || !body.trim()) {
      res.status(400).json({ success: false, message: 'category와 body는 필수 문자열입니다.' });
      return;
    }

    // 글자수 제한
    if (body.length > 1000) {
      res.status(400).json({ success: false, message: '내용은 1000자 이하로 입력해주세요.' });
      return;
    }

    // category enum 검증
    if (!VALID_CATEGORIES.includes(category as FeedbackCategory)) {
      res.status(400).json({
        success: false,
        message: `category는 ${VALID_CATEGORIES.join(', ')} 중 하나여야 합니다.`,
      });
      return;
    }

    // category=other일 때 otherCategory 필수
    if (category === 'other' && (typeof otherCategory !== 'string' || !otherCategory.trim())) {
      res
        .status(400)
        .json({ success: false, message: 'other 카테고리 선택 시 otherCategory가 필요합니다.' });
      return;
    }

    // TODO: 인증 완성 후 req.user 정보로 교체
    const submittedBy = 'Guest';
    const userId = undefined;

    await createFeedback({
      category: category as FeedbackCategory,
      otherCategory,
      body,
      email,
      submittedBy,
      userId,
    });

    res.status(201).json({ success: true, message: '피드백이 접수되었습니다.' });
  } catch (err) {
    next(err);
  }
};
