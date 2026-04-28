import { prisma } from '../lib/prisma';

interface GetArticlesParams {
  category?: string;
  q?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export const getArticles = async ({
  category,
  q,
  sort = 'latest',
  page = 1,
  limit = 10,
}: GetArticlesParams) => {
  const skip = (page - 1) * limit;

  const where = {
    status: 'PUBLISHED' as const,
    ...(category && {
      category: { name: { equals: category, mode: 'insensitive' as const } },
    }),
    ...(q && {
      OR: [
        { title: { contains: q, mode: 'insensitive' as const } },
        { content: { contains: q, mode: 'insensitive' as const } },
      ],
    }),
  };

  const orderBy =
    sort === 'popular'
      ? { viewCount: 'desc' as const }
      : sort === 'trending'
        ? { likes: { _count: 'desc' as const } }
        : { createdAt: 'desc' as const };

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        imageUrl: true,
        viewCount: true,
        createdAt: true,
        category: { select: { id: true, name: true } },
        _count: { select: { likes: true, comments: true } },
      },
    }),
    prisma.article.count({ where }),
  ]);

  return {
    articles,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getArticleById = async (id: string) => {
  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });

  if (!article || article.status !== 'PUBLISHED') return null;

  await prisma.article.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  });

  return article;
};
