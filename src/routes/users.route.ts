import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: 유저 프로필 및 활동 정보
 */

// 모든 유저 관련 API는 인증이 필요함
router.use(authMiddleware);

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: 내 프로필 조회 🥒
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 프로필 조회 성공
 */
router.get('/me', userController.getMyProfile);

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     summary: 내 프로필 수정 🥒
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nickname:
 *                 type: string
 *               avatarEmoji:
 *                 type: string
 *               avatarColor:
 *                 type: string
 *     responses:
 *       200:
 *         description: 프로필 수정 성공
 */
router.put('/me', userController.updateMyProfile);

/**
 * @swagger
 * /api/users/me:
 *   delete:
 *     summary: 회원 탈퇴 🥒
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 회원 탈퇴 성공
 */
router.delete('/me', userController.deleteMyAccount);

/**
 * @swagger
 * /api/users/me/likes:
 *   get:
 *     summary: 내가 좋아요 한 콘텐츠 목록 조회 🥒
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 좋아요 목록 조회 성공
 */
router.get('/me/likes', userController.getMyLikes);

export default router;
