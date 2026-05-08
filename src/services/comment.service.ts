import { prisma } from '../lib/prisma';

export const getComments = async (articleId: string, cursor?: string, limit = 10) => {
  const comments = await prisma.comment.findMany({
    where: {
      articleId,
      deletedAt: null,
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1, // 다음 페이지 존재 여부 확인용으로 1개 더 가져옴
    ...(cursor && { cursor: { id: cursor }, skip: 1 }), // Prisma 내장 커서 (cursor 항목 자체는 skip)
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

  const hasMore = comments.length > limit;
  const data = hasMore ? comments.slice(0, limit) : comments;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  return { data, nextCursor, hasMore };
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
