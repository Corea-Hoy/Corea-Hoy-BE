import { Router } from 'express';
import { submitFeedback } from '../controllers/feedback.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Feedback
 *   description: 피드백
 */

/**
 * @swagger
 * /api/feedback:
 *   post:
 *     summary: 피드백 제출 (비로그인 가능)🥒
 *     tags: [Feedback]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [category, body]
 *             properties:
 *               category:
 *                 type: string
 *                 enum: [ui, content, translation, feature, bug, other]
 *                 description: "ui(디자인/사용성) | content(콘텐츠 퀄리티) | translation(번역) | feature(기능 제안) | bug(버그) | other(기타)"
 *               otherCategory:
 *                 type: string
 *                 description: category가 other일 때 필수
 *               body:
 *                 type: string
 *                 maxLength: 1000
 *                 description: 상세 내용 (필수, 최대 1000자)
 *               email:
 *                 type: string
 *                 description: 답변 받을 이메일 (선택)
 *     responses:
 *       201:
 *         description: 피드백 제출 성공
 */
router.post('/', submitFeedback);

export default router;
