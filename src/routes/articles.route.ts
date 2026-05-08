import { Router } from 'express';
import {
  getArticlesController,
  getArticleController,
  getArticleSuggestionsController,
} from '../controllers/article.controller';
import { getComments, createComment } from '../controllers/comment.controller';
import { toggleLike } from '../controllers/like.controller';
import { authMiddleware, optionalAuthMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Articles
 *   description: 뉴스 컨텐츠
 */

/**
 * @swagger
 * /api/articles:
 *   get:
 *     summary: 뉴스 피드 조회 (카테고리, 검색, 정렬)🥒
 *     tags: [Articles]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: 카테고리 슬러그 (kpop, drama, news, culture, sports, food)
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: 검색어
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [latest, popular, trending]
 *         description: 정렬 기준
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
 */
router.get('/', getArticlesController);

/**
 * @swagger
 * /api/articles/suggestions:
 *   get:
 *     summary: 검색어 자동완성 🥒
 *     tags: [Articles]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: 검색어 (2글자 이상)
 *     responses:
 *       200:
 *         description: 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       titleKo:
 *                         type: string
 *                       titleEs:
 *                         type: string
 */
router.get('/suggestions', getArticleSuggestionsController);

/**
 * @swagger
 * /api/articles/{id}:
 *   get:
 *     summary: 뉴스 상세 조회 (조회수 +1)🥒
 *     tags: [Articles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 성공
 *       404:
 *         description: 컨텐츠 없음
 */
router.get('/:id', optionalAuthMiddleware, getArticleController);

/**
 * @swagger
 * /api/articles/{id}/like:
 *   post:
 *     summary: 좋아요 토글 (생성/삭제)🥒
 *     tags: [Articles]
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
 *         description: 성공
 *       401:
 *         description: 인증 필요
 */
router.post('/:id/like', authMiddleware, toggleLike);

/**
 * @swagger
 * /api/articles/{id}/comments:
 *   get:
 *     summary: 특정 기사의 댓글 리스트 조회 (최신순, 커서 페이지네이션) 🥒
 *     tags: [Articles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: 마지막으로 받은 댓글 ID (없으면 첫 페이지)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 가져올 댓글 수 (기본 10, 최대 50)
 *     responses:
 *       200:
 *         description: 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                 nextCursor:
 *                   type: string
 *                   nullable: true
 *                   description: 다음 페이지 커서 (null이면 마지막 페이지)
 *                 hasMore:
 *                   type: boolean
 *                   description: 더 불러올 댓글이 있는지 여부
 *   post:
 *     summary: 댓글 작성 🥒
 *     tags: [Articles]
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
 *       201:
 *         description: 댓글 작성 성공
 *       401:
 *         description: 인증 필요
 */
router.get('/:id/comments', getComments);
router.post('/:id/comments', authMiddleware, createComment);

export default router;
