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
      // 좋아요 삭제 + 총 개수 동시 조회
      const [, likeCount] = await Promise.all([
        prisma.like.delete({ where: { userId_articleId: { userId, articleId } } }),
        prisma.like.count({ where: { articleId } }).then((count) => count - 1), // 삭제 후 개수
      ]);
      return { liked: false, likeCount };
    }
    throw e;
  }
};
