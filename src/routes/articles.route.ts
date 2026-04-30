import { Router, Request, Response } from 'express';
import { getArticlesController, getArticleController } from '../controllers/article.controller';

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
router.get('/:id', getArticleController);

/**
 * @swagger
 * /api/articles/{id}/like:
 *   post:
 *     summary: 좋아요 토글 (생성/삭제)
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
router.post('/:id/like', (req: Request, res: Response) => {
  res.json({ message: 'toggle like' });
});

/**
 * @swagger
 * /api/articles/{id}/scrap:
 *   post:
 *     summary: 스크랩 토글 (생성/삭제)
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
router.post('/:id/scrap', (req: Request, res: Response) => {
  res.json({ message: 'toggle scrap' });
});

/**
 * @swagger
 * /api/articles/{id}/comments:
 *   get:
 *     summary: 특정 기사의 댓글 리스트 조회
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
 *   post:
 *     summary: 댓글 작성
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
router.get('/:id/comments', (req: Request, res: Response) => {
  res.json({ message: 'get comments' });
});
router.post('/:id/comments', (req: Request, res: Response) => {
  res.json({ message: 'create comment' });
});

export default router;
