import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

export const toggleLike = async (articleId: string, userId: string) => {
  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article) return null;

  try {
    // 좋아요 추가 + 총 개수 동시 조회
    await prisma.like.create({ data: { userId, articleId } });
    const likeCount = await prisma.like.count({ where: { articleId } });
    return { liked: true, likeCount };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      // 삭제 완료 후 카운트 조회 (순서 보장)
      await prisma.like.delete({ where: { userId_articleId: { userId, articleId } } });
      const likeCount = await prisma.like.count({ where: { articleId } });
      return { liked: false, likeCount };
    }
    throw e;
  }
};
