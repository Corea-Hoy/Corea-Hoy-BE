import rateLimit from 'express-rate-limit';

/** 일반 API 전체 — 1분에 100회 */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
});

/** 댓글 작성 — 1분에 10회 */
export const commentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: '댓글을 너무 빠르게 작성하고 있어요. 잠시 후 다시 시도해주세요.',
  },
});

/** 좋아요 — 1분에 30회 */
export const likeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
});

/** 어드민 AI 생성 — 1분에 5회 (Gemini 비용 보호) */
export const adminAiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'AI 생성 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
});
