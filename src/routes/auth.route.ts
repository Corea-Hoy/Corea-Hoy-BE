import { Router } from 'express';
import { getMe } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: 인증 및 유저 정보
 */

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: 내 정보 조회 및 최초 로그인 시 유저 자동 생성 (JIT Provisioning)🥒
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 유저 정보 조회 및 DB 동기화 성공
 *       401:
 *         description: 인증 토큰이 없거나 유효하지 않음
 */
router.get('/me', authMiddleware, getMe);

export default router;
