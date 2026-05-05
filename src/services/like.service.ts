import { prisma } from '../lib/prisma';

export const toggleLike = async (articleId: string, userId: string) => {
  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article) return null;

  const existing = await prisma.like.findUnique({
    where: { userId_articleId: { userId, articleId } },
  });

  if (existing) {
    await prisma.like.delete({
      where: { userId_articleId: { userId, articleId } },
    });
    return { liked: false };
  } else {
    await prisma.like.create({
      data: { userId, articleId },
    });
    return { liked: true };
  }
};
