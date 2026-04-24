import { Router, Request, Response } from 'express';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: 인증
 */

/**
 * @swagger
 * /api/auth/google:
 *   post:
 *     summary: Google OAuth 로그인 후 유저 등록 및 JWT 발급
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: JWT 발급 성공
 */
router.post('/google', (req: Request, res: Response) => {
  res.json({ message: 'google auth' });
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Access Token 만료 시 갱신
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: 토큰 갱신 성공
 */
router.post('/refresh', (req: Request, res: Response) => {
  res.json({ message: 'refresh token' });
});

export default router;
