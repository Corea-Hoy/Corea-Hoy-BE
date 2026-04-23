import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
}

// Express 에러 핸들러는 반드시 파라미터가 4개여야 함
export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
): void {
  const statusCode = err.statusCode ?? 500;
  const message = err.message ?? '서버 오류가 발생했습니다.';

  console.error(`[Error] ${statusCode}: ${message}`);

  res.status(statusCode).json({
    success: false,
    message,
  });
}
