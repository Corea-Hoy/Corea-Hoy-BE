import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../middlewares/auth.middleware';
import {
  searchNews,
  generateContent,
  getAdminArticles,
  createDraftArticle,
  updateArticle,
  publishArticle,
  deleteArticle,
} from '../controllers/admin.controller';

const router = Router();

router.use(authMiddleware, adminMiddleware);

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: 관리자 파이프라인 🥒
 */

/**
 * @swagger
 * /api/admin/pipeline/search:
 *   post:
 *     summary: 뉴스 원문 수집 (RSS)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 기사 후보 목록 반환
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 관리자 권한 필요
 */
router.post('/pipeline/search', searchNews);

/**
 * @swagger
 * /api/admin/pipeline/generate:
 *   post:
 *     summary: "[AI] 한국어 기사 생성 또는 스페인어 번역"
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [mode]
 *             properties:
 *               mode:
 *                 type: string
 *                 enum: [generate, translate]
 *                 description: "generate(원본→한국어) | translate(한국어→스페인어)"
 *               title:
 *                 type: string
 *                 description: 원본 제목 (mode=generate 필수)
 *               content:
 *                 type: string
 *                 description: 원본 내용 (mode=generate 필수)
 *               titleKo:
 *                 type: string
 *                 description: 한국어 제목 (mode=translate 필수)
 *               bodyKo:
 *                 type: string
 *                 description: 한국어 본문 (mode=translate 필수)
 *     responses:
 *       200:
 *         description: AI 생성 결과 반환
 */
router.post('/pipeline/generate', generateContent);

/**
 * @swagger
 * /api/admin/articles:
 *   get:
 *     summary: 전체 기사 관리 목록 조회 (상태별 필터)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, PUBLISHED, ARCHIVED]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 성공
 *   post:
 *     summary: 기사 DRAFT 저장
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [titleKo, bodyKo, categoryId, sourceUrl]
 *             properties:
 *               titleKo:
 *                 type: string
 *               bodyKo:
 *                 type: string
 *               culturalNoteKo:
 *                 type: string
 *               titleEs:
 *                 type: string
 *               bodyEs:
 *                 type: string
 *               culturalNoteEs:
 *                 type: string
 *               thumbnailUrl:
 *                 type: string
 *               categoryId:
 *                 type: integer
 *               sourceUrl:
 *                 type: string
 *               sourceTitle:
 *                 type: string
 *               draftStep:
 *                 type: string
 *                 enum: [select, review-ko, review-es, preview]
 *               langStatusKo:
 *                 type: string
 *                 enum: [pending, done]
 *               langStatusEs:
 *                 type: string
 *                 enum: [pending, done]
 *     responses:
 *       201:
 *         description: DRAFT 저장 성공
 */
router.get('/articles', getAdminArticles);
router.post('/articles', createDraftArticle);

/**
 * @swagger
 * /api/admin/articles/{id}:
 *   put:
 *     summary: 기사 내용 수동 수정
 *     tags: [Admin]
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
 *               titleKo:
 *                 type: string
 *               bodyKo:
 *                 type: string
 *               titleEs:
 *                 type: string
 *               bodyEs:
 *                 type: string
 *               draftStep:
 *                 type: string
 *                 enum: [select, review-ko, review-es, preview]
 *               langStatusKo:
 *                 type: string
 *                 enum: [pending, done]
 *               langStatusEs:
 *                 type: string
 *                 enum: [pending, done]
 *     responses:
 *       200:
 *         description: 수정 성공
 *   delete:
 *     summary: 기사 영구 삭제
 *     tags: [Admin]
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
 */
router.put('/articles/:id', updateArticle);
router.delete('/articles/:id', deleteArticle);

/**
 * @swagger
 * /api/admin/articles/{id}/publish:
 *   patch:
 *     summary: 기사 발행 (PUBLISHED 상태로 변경)
 *     tags: [Admin]
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
 *         description: 발행 성공
 */
router.patch('/articles/:id/publish', publishArticle);

export default router;
