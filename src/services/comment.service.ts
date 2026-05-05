import { prisma } from '../lib/prisma';

export const getComments = async (articleId: string) => {
  return prisma.comment.findMany({
    where: {
      articleId,
      deletedAt: null,
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      body: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: { id: true, nickname: true, avatarEmoji: true },
      },
    },
  });
};

export const createComment = async (articleId: string, userId: string, body: string) => {
  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article) return null;

  return prisma.comment.create({
    data: { articleId, userId, body },
    select: {
      id: true,
      body: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: { id: true, nickname: true, avatarEmoji: true },
      },
    },
  });
};

export const updateComment = async (commentId: string, userId: string, body: string) => {
  const comment = await prisma.comment.findFirst({
    where: { id: commentId, deletedAt: null },
  });
  if (!comment) return null;
  if (comment.userId !== userId) return 'forbidden';

  return prisma.comment.update({
    where: { id: commentId },
    data: { body, updatedAt: new Date() },
    select: {
      id: true,
      body: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: { id: true, nickname: true, avatarEmoji: true },
      },
    },
  });
};

export const deleteComment = async (commentId: string, userId: string) => {
  const comment = await prisma.comment.findFirst({
    where: { id: commentId, deletedAt: null },
  });
  if (!comment) return null;
  if (comment.userId !== userId) return 'forbidden';

  return prisma.comment.update({
    where: { id: commentId },
    data: { deletedAt: new Date() },
  });
};
