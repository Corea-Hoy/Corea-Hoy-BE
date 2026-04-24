import { Router, Request, Response } from 'express';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: 댓글
 */

/**
 * @swagger
 * /api/comments/{id}:
 *   put:
 *     summary: 댓글 수정 (본인만)
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               body:
 *                 type: string
 *     responses:
 *       200:
 *         description: 수정 성공
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 *   delete:
 *     summary: 댓글 삭제 (본인만)
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 삭제 성공
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 */
router.put('/:id', (req: Request, res: Response) => {
  res.json({ message: 'update comment' });
});

router.delete('/:id', (req: Request, res: Response) => {
  res.json({ message: 'delete comment' });
});

export default router;
