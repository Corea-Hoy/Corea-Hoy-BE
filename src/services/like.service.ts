import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

export const toggleLike = async (articleId: string, userId: string) => {
  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article) return null;

  try {
    await prisma.like.create({ data: { userId, articleId } });
    return { liked: true };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      await prisma.like.delete({
        where: { userId_articleId: { userId, articleId } },
      });
      return { liked: false };
    }
    throw e;
  }
};
