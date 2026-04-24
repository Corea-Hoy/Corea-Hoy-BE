import { Router } from 'express';
import authRouter from './auth.route';
import articlesRouter from './articles.route';
import commentsRouter from './comments.route';
import categoriesRouter from './categories.route';
import usersRouter from './users.route';
import feedbackRouter from './feedback.route';
import adminRouter from './admin.route';

const router = Router();

router.use('/auth', authRouter);
router.use('/articles', articlesRouter);
router.use('/comments', commentsRouter);
router.use('/categories', categoriesRouter);
router.use('/users', usersRouter);
router.use('/feedback', feedbackRouter);
router.use('/admin', adminRouter);

export default router;
