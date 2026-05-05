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
 *   description: |
 *     관리자 전용 기사 파이프라인 🥒
 *
 *     **기사 작성 순서**
 *     1. `POST /pipeline/search` - 뉴스 수집 (언론사별 최신 기사 15개 반환)
 *     2. `POST /pipeline/generate` (mode: generate) - 원본 기사 → 한국어 기사 생성
 *     3. `POST /pipeline/generate` (mode: translate) - 한국어 기사 → 스페인어 번역
 *     4. `POST /articles` - 생성된 내용 DB에 DRAFT 저장
 *     5. `PATCH /articles/{id}/publish` - 검토 후 발행
 */

/**
 * @swagger
 * /api/admin/pipeline/search:
 *   post:
 *     summary: "① 뉴스 수집 - 언론사별 최신 기사 15개 반환 🥒"
 *     description: |
 *       RSS 피드(연합뉴스, MBC, 경향신문 등)와 네이버 뉴스 API에서 기사를 수집합니다.
 *       언론사별 최대 3개씩, 총 15개를 반환하며 이미 DB에 저장된 기사는 자동으로 제외됩니다.
 *
 *       반환 필드:
 *       - `title`: 기사 제목
 *       - `summary`: 기사 요약
 *       - `url`: 원본 기사 URL → POST /articles의 sourceUrl에 사용
 *       - `thumbnailUrl`: 썸네일 이미지 URL (없으면 null)
 *       - `source`: 언론사명
 *       - `category`: 카테고리명
 *       - `slug`: 카테고리 슬러그 (kpop / sports / culture / news)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 기사 후보 목록 반환
 *       401:
 *         description: 인증 토큰 없음
 *       403:
 *         description: 관리자 권한 없음
 */
router.post('/pipeline/search', searchNews);

/**
 * @swagger
 * /api/admin/pipeline/generate:
 *   post:
 *     summary: "② AI 기사 생성 / 번역 🥒"
 *     description: |
 *       **mode: generate** - 원본 기사(title + content) → 한국어 기사 생성
 *       - 필수값: title, content (search 결과의 title, summary 사용)
 *       - 반환값: titleKo, bodyKo, culturalNoteKo
 *
 *       **mode: translate** - 한국어 기사 → 스페인어 번역
 *       - 필수값: titleKo, bodyKo (generate 결과 사용)
 *       - 반환값: titleEs, bodyEs, culturalNoteEs
 *
 *       생성된 결과는 POST /articles에 그대로 사용하면 됩니다.
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
 *                 description: "원본 기사 제목 (mode=generate 필수)"
 *               content:
 *                 type: string
 *                 description: "원본 기사 내용 (mode=generate 필수)"
 *               titleKo:
 *                 type: string
 *                 description: "한국어 제목 (mode=translate 필수)"
 *               bodyKo:
 *                 type: string
 *                 description: "한국어 본문 (mode=translate 필수)"
 *     responses:
 *       200:
 *         description: |
 *           generate → { titleKo, bodyKo, culturalNoteKo }
 *           translate → { titleEs, bodyEs, culturalNoteEs }
 *       400:
 *         description: mode 또는 필수 필드 누락
 *       401:
 *         description: 인증 토큰 없음
 *       403:
 *         description: 관리자 권한 없음
 */
router.post('/pipeline/generate', generateContent);

/**
 * @swagger
 * /api/admin/articles:
 *   get:
 *     summary: "기사 목록 조회 (상태별 필터) 🥒"
 *     description: 관리자용 전체 기사 목록입니다. status로 필터링하고 page/limit으로 페이지네이션할 수 있습니다.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, PUBLISHED, ARCHIVED]
 *         description: "미입력 시 전체 조회"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: "{ articles, pagination: { total, page, limit, totalPages } }"
 *   post:
 *     summary: "③ 기사 DRAFT 저장 🥒"
 *     description: |
 *       generate/translate 결과를 조합해서 DB에 저장합니다.
 *
 *       **draftStep** - 현재 파이프라인 단계
 *       - select: 기사 선택 단계
 *       - review-ko: 한국어 검토 단계
 *       - review-es: 스페인어 검토 단계
 *       - preview: 최종 미리보기 (발행 직전)
 *
 *       **langStatusKo / langStatusEs** - 각 언어 작성 완료 여부
 *       - pending: 미완성
 *       - done: 완성
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
 *                 description: "한국어 제목 (필수)"
 *               bodyKo:
 *                 type: string
 *                 description: "한국어 본문 (필수)"
 *               culturalNoteKo:
 *                 type: string
 *                 description: "한국어 한줄 요약"
 *               titleEs:
 *                 type: string
 *                 description: "스페인어 제목"
 *               bodyEs:
 *                 type: string
 *                 description: "스페인어 본문"
 *               culturalNoteEs:
 *                 type: string
 *                 description: "스페인어 한줄 요약"
 *               thumbnailUrl:
 *                 type: string
 *                 description: "썸네일 이미지 URL (search 결과의 thumbnailUrl 사용)"
 *               categoryId:
 *                 type: integer
 *                 description: "카테고리 ID (필수)"
 *               sourceUrl:
 *                 type: string
 *                 description: "원본 기사 URL (필수, search 결과의 url 사용)"
 *               sourceTitle:
 *                 type: string
 *                 description: "원본 기사 제목 (search 결과의 title 사용)"
 *               draftStep:
 *                 type: string
 *                 enum: [select, review-ko, review-es, preview]
 *                 description: "현재 파이프라인 단계 (기본값: select)"
 *               langStatusKo:
 *                 type: string
 *                 enum: [pending, done]
 *                 description: "한국어 작성 완료 여부 (기본값: pending)"
 *               langStatusEs:
 *                 type: string
 *                 enum: [pending, done]
 *                 description: "스페인어 작성 완료 여부 (기본값: pending)"
 *     responses:
 *       201:
 *         description: DRAFT 저장 성공
 *       400:
 *         description: 필수 필드 누락 또는 유효하지 않은 값
 */
router.get('/articles', getAdminArticles);
router.post('/articles', createDraftArticle);

/**
 * @swagger
 * /api/admin/articles/{id}:
 *   put:
 *     summary: "기사 내용 수동 수정 🥒"
 *     description: 저장된 기사 내용을 수정합니다. 수정할 필드만 포함해서 보내면 됩니다.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 기사 UUID
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
 *               culturalNoteKo:
 *                 type: string
 *               titleEs:
 *                 type: string
 *               bodyEs:
 *                 type: string
 *               culturalNoteEs:
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
 *       400:
 *         description: 유효하지 않은 값
 *       404:
 *         description: 기사를 찾을 수 없음
 *   delete:
 *     summary: "기사 영구 삭제 🥒"
 *     description: 기사를 DB에서 완전히 삭제합니다. 복구 불가능합니다.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 기사 UUID
 *     responses:
 *       200:
 *         description: 삭제 성공
 *       404:
 *         description: 기사를 찾을 수 없음
 */
router.put('/articles/:id', updateArticle);
router.delete('/articles/:id', deleteArticle);

/**
 * @swagger
 * /api/admin/articles/{id}/publish:
 *   patch:
 *     summary: "⑤ 기사 발행 🥒"
 *     description: |
 *       기사 상태를 PUBLISHED로 변경하고 publishedAt을 현재 시각으로 설정합니다.
 *       발행된 기사는 GET /api/articles에서 일반 사용자에게 노출됩니다.
 *       이미 발행된 기사는 중복 발행되지 않습니다.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 기사 UUID
 *     responses:
 *       200:
 *         description: 발행 성공
 *       404:
 *         description: 기사를 찾을 수 없음
 */
router.patch('/articles/:id/publish', publishArticle);

export default router;
