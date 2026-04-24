import { Router, Request, Response } from 'express';

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
 *     summary: 피드백 제출 (비로그인 가능)
 *     tags: [Feedback]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *                 enum: [ui, content, translation, feature, bug, other]
 *               otherCategory:
 *                 type: string
 *               body:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: 피드백 제출 성공
 */
router.post('/', (req: Request, res: Response) => {
  res.json({ message: 'submit feedback' });
});

export default router;
