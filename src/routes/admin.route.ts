import { Router, Request, Response } from 'express';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: 관리자 파이프라인
 */

/**
 * @swagger
 * /api/admin/pipeline/search:
 *   post:
 *     summary: 뉴스 원문 수집 (네이버 뉴스 API 연동)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 *                 description: 검색 키워드
 *     responses:
 *       200:
 *         description: 기사 목록 반환
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 관리자 권한 필요
 */
router.post('/pipeline/search', (req: Request, res: Response) => {
  res.json({ message: 'fetch news from naver api' });
});

/**
 * @swagger
 * /api/admin/pipeline/generate:
 *   post:
 *     summary: "[AI] 기사 스페인어 번역 및 요약문 생성 (Gemini API)"
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               summary:
 *                 type: string
 *     responses:
 *       200:
 *         description: AI 생성 결과 반환
 */
router.post('/pipeline/generate', (req: Request, res: Response) => {
  res.json({ message: 'generate with gemini ai' });
});

/**
 * @swagger
 * /api/admin/articles:
 *   get:
 *     summary: 전체 관리 목록 조회 (상태별 필터)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, PUBLISHED, ARCHIVED]
 *     responses:
 *       200:
 *         description: 성공
 *   post:
 *     summary: 생성된 데이터를 DRAFT 상태로 임시저장
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: 임시저장 성공
 */
router.get('/articles', (req: Request, res: Response) => {
  res.json({ message: 'get all articles (admin)' });
});

router.post('/articles', (req: Request, res: Response) => {
  res.json({ message: 'save draft article' });
});

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
router.put('/articles/:id', (req: Request, res: Response) => {
  res.json({ message: 'update article (admin)' });
});

router.delete('/articles/:id', (req: Request, res: Response) => {
  res.json({ message: 'delete article (admin)' });
});

/**
 * @swagger
 * /api/admin/articles/{id}/publish:
 *   patch:
 *     summary: 기사 상태를 PUBLISHED로 변경
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
router.patch('/articles/:id/publish', (req: Request, res: Response) => {
  res.json({ message: 'publish article' });
});

export default router;
