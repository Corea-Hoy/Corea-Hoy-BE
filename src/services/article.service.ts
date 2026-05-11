import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

interface GetArticlesParams {
  category?: string;
  q?: string;
  sort?: string;
  page?: number;
  limit?: number;
  userId?: string;
}

export const getArticles = async ({
  category,
  q,
  sort = 'latest',
  page = 1,
  limit = 10,
  userId,
}: GetArticlesParams) => {
  const skip = (page - 1) * limit;

  const where: Prisma.ArticleWhereInput = {
    status: 'PUBLISHED' as const,
    ...(category && {
      category: { slug: { equals: category, mode: 'insensitive' as const } },
    }),
    ...(q && {
      OR: [
        { titleKo: { contains: q, mode: 'insensitive' as const } },
        { bodyKo: { contains: q, mode: 'insensitive' as const } },
        { titleEs: { contains: q, mode: 'insensitive' as const } },
        { bodyEs: { contains: q, mode: 'insensitive' as const } },
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
        titleKo: true,
        titleEs: true,
        thumbnailUrl: true,
        viewCount: true,
        publishedAt: true,
        createdAt: true,
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { likes: true, comments: true } },
      },
    }),
    prisma.article.count({ where }),
  ]);

  // 로그인 유저면 좋아요 여부 일괄 조회
  let likedSet = new Set<string>();
  if (userId && articles.length > 0) {
    const articleIds = articles.map((a) => a.id);
    const likes = await prisma.like.findMany({
      where: { userId, articleId: { in: articleIds } },
      select: { articleId: true },
    });
    likedSet = new Set(likes.map((l) => l.articleId));
  }

  return {
    articles: articles.map((a) => ({ ...a, isLiked: likedSet.has(a.id) })),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getArticleById = async (id: string, viewerKey?: string, userId?: string) => {
  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      sources: true,
      _count: { select: { likes: true, comments: true } },
    },
  });

  if (!article || article.status !== 'PUBLISHED') return null;

  if (viewerKey) {
    try {
      // ArticleView 생성 + viewCount 증가를 트랜잭션으로 묶어 데이터 일관성 보장
      const [updated, isLiked] = await Promise.all([
        prisma.$transaction([
          prisma.articleView.create({ data: { articleId: id, viewerKey } }),
          prisma.article.update({
            where: { id },
            data: { viewCount: { increment: 1 } },
            include: {
              category: { select: { id: true, name: true, slug: true } },
              sources: true,
              _count: { select: { likes: true, comments: true } },
            },
          }),
        ]),
        userId
          ? prisma.like
              .findUnique({ where: { userId_articleId: { userId, articleId: id } } })
              .then(Boolean)
          : Promise.resolve(false),
      ]);

      return { ...(updated[1] as typeof article), isLiked };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        // 중복 조회 — viewCount 증가 없이 기사만 반환
        const isLiked = userId
          ? !!(await prisma.like.findUnique({
              where: { userId_articleId: { userId, articleId: id } },
            }))
          : false;
        return { ...article, isLiked };
      }
      console.error('[viewCount] 트랜잭션 실패:', e);
    }
  }

  // viewerKey 없는 경우 (중복 방지 없이 기사만 반환)
  const isLiked = userId
    ? !!(await prisma.like.findUnique({ where: { userId_articleId: { userId, articleId: id } } }))
    : false;
  return { ...article, isLiked };
};

export const getArticleSuggestions = async (q: string) => {
  if (q.trim().length < 2) return [];

  return prisma.article.findMany({
    where: {
      status: 'PUBLISHED',
      OR: [
        { titleKo: { contains: q, mode: 'insensitive' } },
        { titleEs: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      titleKo: true,
      titleEs: true,
    },
    take: 7,
  });
};
