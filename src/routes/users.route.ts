import { Router, Request, Response } from 'express';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: 유저
 */

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: 내 프로필 조회
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 성공
 *       401:
 *         description: 인증 필요
 *   put:
 *     summary: 내 프로필 수정
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 수정 성공
 *   delete:
 *     summary: 회원 탈퇴
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 탈퇴 성공
 */
router.get('/me', (req: Request, res: Response) => {
  res.json({ message: 'get my profile' });
});

router.put('/me', (req: Request, res: Response) => {
  res.json({ message: 'update my profile' });
});

router.delete('/me', (req: Request, res: Response) => {
  res.json({ message: 'delete account' });
});

/**
 * @swagger
 * /api/users/me/likes:
 *   get:
 *     summary: 내가 좋아요한 컨텐츠 목록
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 성공
 */
router.get('/me/likes', (req: Request, res: Response) => {
  res.json({ message: 'get my likes' });
});

/**
 * @swagger
 * /api/users/me/scraps:
 *   get:
 *     summary: 내가 스크랩한 컨텐츠 목록
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 성공
 */
router.get('/me/scraps', (req: Request, res: Response) => {
  res.json({ message: 'get my scraps' });
});

export default router;
