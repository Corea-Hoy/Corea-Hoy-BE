import { Router } from 'express';
import { getMe, googleLogin } from '../controllers/auth.controller';
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
 * /api/auth/google:
 *   post:
 *     summary: 구글 ID 토큰으로 로그인/회원가입
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_token:
 *                 type: string
 *     responses:
 *       200:
 *         description: 로그인 성공 및 자체 JWT 발급
 *       401:
 *         description: 유효하지 않은 토큰
 */
router.post('/google', googleLogin);

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
 *         description: 유저 정보 조회 성공
 *       401:
 *         description: 인증 정보가 없음
 */
router.get('/me', authMiddleware, getMe);

export default router;
