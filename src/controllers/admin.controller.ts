import { Request, Response, NextFunction } from 'express';
import { ArticleStatus, DraftStep, LangStatus } from '@prisma/client';
import * as adminService from '../services/admin.service';

const draftStepMap: Record<string, DraftStep> = {
  select: DraftStep.select,
  'review-ko': DraftStep.review_ko,
  'review-es': DraftStep.review_es,
  preview: DraftStep.preview,
};

const validLangStatuses = Object.values(LangStatus);

// ============================================
// 파이프라인 - 뉴스 수집
// ============================================

export const searchNews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const articles = await adminService.searchNews();
    res.json({ success: true, data: articles });
  } catch (err) {
    next(err);
  }
};

// ============================================
// 파이프라인 - AI 생성 / 번역
// ============================================

export const generateContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { mode, title, content, titleKo, bodyKo } = req.body ?? {};

    if (!mode || !['generate', 'translate'].includes(mode)) {
      res
        .status(400)
        .json({ success: false, message: 'mode는 generate 또는 translate여야 합니다.' });
      return;
    }

    if (mode === 'generate' && (!title || !content)) {
      res
        .status(400)
        .json({ success: false, message: 'generate 모드는 title과 content가 필요합니다.' });
      return;
    }

    if (mode === 'translate' && (!titleKo || !bodyKo)) {
      res
        .status(400)
        .json({ success: false, message: 'translate 모드는 titleKo와 bodyKo가 필요합니다.' });
      return;
    }

    const result = await adminService.generateContent(mode, { title, content, titleKo, bodyKo });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// ============================================
// 기사 CRUD
// ============================================

export const getAdminArticles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));

    const validStatuses = Object.values(ArticleStatus);
    if (status && !validStatuses.includes(status as ArticleStatus)) {
      res.status(400).json({
        success: false,
        message: `status는 ${validStatuses.join(', ')} 중 하나여야 합니다.`,
      });
      return;
    }

    const result = await adminService.getAdminArticles(
      status as ArticleStatus | undefined,
      page,
      limit,
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getAdminArticleById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const article = await adminService.getAdminArticleById(req.params.id as string);

    if (!article) {
      res.status(404).json({ success: false, message: '기사를 찾을 수 없습니다.' });
      return;
    }

    res.json({ success: true, data: article });
  } catch (err) {
    next(err);
  }
};

export const createDraftArticle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      titleKo,
      bodyKo,
      culturalNoteKo,
      titleEs,
      bodyEs,
      culturalNoteEs,
      thumbnailUrl,
      categoryId,
      sourceUrl,
      sourceTitle,
      draftStep,
      langStatusKo,
      langStatusEs,
    } = req.body ?? {};

    if (!titleKo || !bodyKo || !categoryId || !sourceUrl) {
      res
        .status(400)
        .json({ success: false, message: 'titleKo, bodyKo, categoryId, sourceUrl은 필수입니다.' });
      return;
    }

    if (langStatusKo && !validLangStatuses.includes(langStatusKo as LangStatus)) {
      res.status(400).json({
        success: false,
        message: `langStatusKo는 ${validLangStatuses.join(', ')} 중 하나여야 합니다.`,
      });
      return;
    }

    if (langStatusEs && !validLangStatuses.includes(langStatusEs as LangStatus)) {
      res.status(400).json({
        success: false,
        message: `langStatusEs는 ${validLangStatuses.join(', ')} 중 하나여야 합니다.`,
      });
      return;
    }

    const article = await adminService.createDraftArticle({
      titleKo,
      bodyKo,
      culturalNoteKo,
      titleEs,
      bodyEs,
      culturalNoteEs,
      thumbnailUrl,
      categoryId: Number(categoryId),
      sourceUrl,
      sourceTitle,
      draftStep: draftStep ? draftStepMap[draftStep] : undefined,
      langStatusKo: langStatusKo as LangStatus | undefined,
      langStatusEs: langStatusEs as LangStatus | undefined,
    });

    if (!article) {
      res.status(400).json({ success: false, message: '이미 저장된 기사입니다. (sourceUrl 중복)' });
      return;
    }

    res.status(201).json({ success: true, data: article });
  } catch (err) {
    next(err);
  }
};

export const updateArticle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = { ...(req.body ?? {}) };
    if (body.draftStep && draftStepMap[body.draftStep]) {
      body.draftStep = draftStepMap[body.draftStep];
    }
    if (body.langStatusKo && !validLangStatuses.includes(body.langStatusKo as LangStatus)) {
      res.status(400).json({
        success: false,
        message: `langStatusKo는 ${validLangStatuses.join(', ')} 중 하나여야 합니다.`,
      });
      return;
    }
    if (body.langStatusEs && !validLangStatuses.includes(body.langStatusEs as LangStatus)) {
      res.status(400).json({
        success: false,
        message: `langStatusEs는 ${validLangStatuses.join(', ')} 중 하나여야 합니다.`,
      });
      return;
    }
    const article = await adminService.updateArticle(req.params.id as string, body);

    if (!article) {
      res.status(404).json({ success: false, message: '기사를 찾을 수 없습니다.' });
      return;
    }

    res.json({ success: true, data: article });
  } catch (err) {
    next(err);
  }
};

export const publishArticle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const article = await adminService.publishArticle(req.params.id as string);

    if (!article) {
      res.status(404).json({ success: false, message: '기사를 찾을 수 없습니다.' });
      return;
    }

    res.json({ success: true, data: article });
  } catch (err) {
    next(err);
  }
};

export const deleteArticle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const article = await adminService.deleteArticle(req.params.id as string);

    if (!article) {
      res.status(404).json({ success: false, message: '기사를 찾을 수 없습니다.' });
      return;
    }

    res.json({ success: true, message: '기사가 삭제되었습니다.' });
  } catch (err) {
    next(err);
  }
};
