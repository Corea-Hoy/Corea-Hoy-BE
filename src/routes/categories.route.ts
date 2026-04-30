import { Router } from 'express';
import { getCategories } from '../controllers/category.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: 카테고리
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: 카테고리 목록 조회 🥒
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: 성공
 */
router.get('/', getCategories);

export default router;
