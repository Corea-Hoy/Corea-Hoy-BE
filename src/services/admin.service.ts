import { ArticleStatus, DraftStep, LangStatus, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { GoogleGenAI } from '@google/genai';
import Parser from 'rss-parser';

interface NewsArticle {
  title: string;
  summary: string | undefined;
  url: string;
  source: string;
  category: string;
  slug: string;
  publishedAt?: string;
  thumbnailUrl: string | null;
}

interface NaverNewsResponse {
  items: {
    title: string;
    description: string;
    originallink: string;
    link: string;
    pubDate: string;
  }[];
}

interface RssItem {
  title: string;
  contentSnippet?: string;
  link: string;
  pubDate?: string;
  mediaContent?: { $: { url: string } };
  mediaThumbnail?: { $: { url: string } };
  enclosure?: { url: string };
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const rssParser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail'],
      ['enclosure', 'enclosure'],
    ],
  },
});

const RSS_FEEDS = [
  {
    url: 'https://www.yna.co.kr/rss/entertainment.xml',
    source: '연합뉴스',
    category: 'K-POP',
    slug: 'kpop',
  },
  {
    url: 'https://www.yna.co.kr/rss/sports.xml',
    source: '연합뉴스',
    category: '스포츠',
    slug: 'sports',
  },
  {
    url: 'https://www.yna.co.kr/rss/culture.xml',
    source: '연합뉴스',
    category: '문화',
    slug: 'culture',
  },
  {
    url: 'https://www.yna.co.kr/rss/politics.xml',
    source: '연합뉴스',
    category: '뉴스',
    slug: 'news',
  },
  {
    url: 'https://imnews.imbc.com/rss/news/news_00.xml',
    source: 'MBC',
    category: '뉴스',
    slug: 'news',
  },
  {
    url: 'https://www.mk.co.kr/rss/30000023/',
    source: '매일경제',
    category: 'K-POP',
    slug: 'kpop',
  },
  {
    url: 'https://isplus.com/rss/index.html',
    source: '일간스포츠',
    category: 'K-POP',
    slug: 'kpop',
  },
  {
    url: 'https://www.khan.co.kr/rss/rssdata/kh_sports.xml',
    source: '경향신문',
    category: '스포츠',
    slug: 'sports',
  },
  {
    url: 'https://star.mt.co.kr/rss/rankingRss.xml',
    source: '스타뉴스',
    category: 'K-POP',
    slug: 'kpop',
  },
];

const NAVER_KEYWORDS = [
  { keyword: 'K-POP 신보', slug: 'kpop', category: 'K-POP' },
  { keyword: '한류 콘서트', slug: 'kpop', category: 'K-POP' },
  { keyword: '아이돌 컴백', slug: 'kpop', category: 'K-POP' },
  { keyword: '케이팝 차트', slug: 'kpop', category: 'K-POP' },
  { keyword: '한국드라마 OTT', slug: 'culture', category: '문화' },
  { keyword: '한국 스포츠', slug: 'sports', category: '스포츠' },
];

const fetchNaverNews = async () => {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) return [];

  const results = await Promise.allSettled(
    NAVER_KEYWORDS.map(async ({ keyword, slug, category }) => {
      const url = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(keyword)}&display=5&sort=date`;
      const res = await fetch(url, {
        headers: {
          'X-Naver-Client-Id': clientId,
          'X-Naver-Client-Secret': clientSecret,
        },
      });
      const data = (await res.json()) as NaverNewsResponse;
      return { slug, category, items: data.items ?? [] };
    }),
  );

  const articles: NewsArticle[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      const { slug, category, items } = result.value;
      items.forEach((item) => {
        articles.push({
          title: item.title.replace(/<[^>]+>/g, ''),
          summary: item.description.replace(/<[^>]+>/g, ''),
          url: item.originallink || item.link,
          source: '네이버뉴스',
          category,
          slug,
          publishedAt: item.pubDate,
          thumbnailUrl: null,
        });
      });
    }
  }
  return articles;
};

export const searchNews = async () => {
  const [feedResults, naverArticles] = await Promise.all([
    Promise.allSettled(
      RSS_FEEDS.map((feed) =>
        rssParser.parseURL(feed.url).then((r) => ({ feed, items: r.items as RssItem[] })),
      ),
    ),
    fetchNaverNews(),
  ]);

  const articles: NewsArticle[] = [];

  for (const result of feedResults) {
    if (result.status === 'fulfilled') {
      const { feed, items } = result.value;
      items.slice(0, 5).forEach((item) => {
        const decodeEntities = (str: string) =>
          str
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&#39;/g, "'");
        articles.push({
          title: decodeEntities(item.title),
          summary: item.contentSnippet ? decodeEntities(item.contentSnippet) : undefined,
          url: item.link,
          source: feed.source,
          category: feed.category,
          slug: feed.slug,
          publishedAt: item.pubDate,
          thumbnailUrl:
            item.mediaContent?.$.url || item.mediaThumbnail?.$.url || item.enclosure?.url || null,
        });
      });
    }
  }

  articles.push(...naverArticles);

  const urls = articles.map((a) => a.url).filter(Boolean);
  const existing = await prisma.articleSource.findMany({
    where: { url: { in: urls } },
    select: { url: true },
  });
  const existingUrls = new Set(existing.map((s) => s.url));
  const filtered = articles.filter((a) => !existingUrls.has(a.url));

  const seenUrls = new Set<string>();
  const deduped = filtered.filter((a) => {
    if (seenUrls.has(a.url)) return false;
    seenUrls.add(a.url);
    return true;
  });

  const sourceMap = new Map<string, NewsArticle[]>();
  for (const article of deduped) {
    if (!sourceMap.has(article.source)) sourceMap.set(article.source, []);
    sourceMap.get(article.source)!.push(article);
  }
  for (const group of sourceMap.values()) {
    for (let i = group.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [group[i], group[j]] = [group[j], group[i]];
    }
  }

  const sources = [...sourceMap.values()];
  const counts = new Array(sources.length).fill(0);
  const indices = new Array(sources.length).fill(0);
  const selected: NewsArticle[] = [];

  while (selected.length < 15) {
    let added = false;
    for (let i = 0; i < sources.length; i++) {
      if (selected.length >= 15) break;
      if (counts[i] >= 3) continue;
      if (indices[i] < sources[i].length) {
        selected.push(sources[i][indices[i]]);
        indices[i]++;
        counts[i]++;
        added = true;
      }
    }
    if (!added) break;
  }

  return selected;
};

export const generateContent = async (
  mode: 'generate' | 'translate',
  data: {
    title?: string;
    content?: string;
    titleKo?: string;
    bodyKo?: string;
  },
) => {
  let prompt = '';

  if (mode === 'generate') {
    prompt = `
      다음은 한국 뉴스 기사야.

      제목: ${data.title}
      내용: ${data.content}

      위 내용을 바탕으로 아래 형식에 맞게 한국어 기사를 작성해줘.
      친숙한 말투로 작성하고, 우리 프로젝트의 마스코트는 오이야.

      [제목-KO]
      한국어 제목

      [본문-KO]
      핵심 내용 중심으로 3~4문단, 각 문단 2~3문장, 외국인 친구에게 설명하는 느낌으로

      [요약-KO]
      한국어 한줄 요약
    `;
  } else {
    prompt = `
      다음은 한국어 기사야. 스페인어(중남미)로 자연스럽게 번역해줘.

      제목: ${data.titleKo}
      본문: ${data.bodyKo}

      아래 형식을 정확히 지켜서 출력해줘:

      [제목-ES]
      Título en español

      [본문-ES]
      Cuerpo del artículo en español, 3~4 párrafos, 2~3 oraciones cada uno

      [요약-ES]
      Resumen en una oración
    `;
  }

  let text = '';
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const result = await ai.models.generateContent({
        model: 'gemma-4-31b-it',
        contents: prompt,
      });
      text = result.text ?? '';
      if (!text) throw new Error('AI 응답이 비어있습니다.');
      break;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      const is503 = msg.includes('503') || msg.includes('UNAVAILABLE');
      const is429 = msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED');
      if (attempt < 5 && (is503 || is429)) {
        const delay = attempt * 15000;
        console.log(
          `⚠️  ${is429 ? '429' : '503'} 에러, ${delay / 1000}초 후 재시도... (${attempt}/5)`,
        );
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw e;
      }
    }
  }

  const extract = (tag: string) => {
    const regex = new RegExp(`\\[${tag}\\]\\s*([\\s\\S]*?)(?=\\[|$)`);
    return text.match(regex)?.[1]?.trim() ?? '';
  };

  if (mode === 'generate') {
    return {
      titleKo: extract('제목-KO'),
      bodyKo: extract('본문-KO'),
      culturalNoteKo: extract('요약-KO'),
    };
  } else {
    return {
      titleEs: extract('제목-ES'),
      bodyEs: extract('본문-ES'),
      culturalNoteEs: extract('요약-ES'),
    };
  }
};

export const getAdminArticles = async (status?: ArticleStatus, page = 1, limit = 20) => {
  const where: Prisma.ArticleWhereInput = status ? { status } : {};
  const skip = (page - 1) * limit;

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        titleKo: true,
        titleEs: true,
        status: true,
        draftStep: true,
        langStatusKo: true,
        langStatusEs: true,
        viewCount: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { likes: true, comments: true } },
      },
    }),
    prisma.article.count({ where }),
  ]);

  return { articles, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

export const createDraftArticle = async (data: {
  titleKo: string;
  bodyKo: string;
  culturalNoteKo?: string;
  titleEs?: string;
  bodyEs?: string;
  culturalNoteEs?: string;
  thumbnailUrl?: string;
  categoryId: number;
  sourceUrl: string;
  sourceTitle?: string;
  draftStep?: DraftStep;
  langStatusKo?: LangStatus;
  langStatusEs?: LangStatus;
}) => {
  return prisma.article.create({
    data: {
      titleKo: data.titleKo,
      bodyKo: data.bodyKo,
      culturalNoteKo: data.culturalNoteKo,
      titleEs: data.titleEs,
      bodyEs: data.bodyEs,
      culturalNoteEs: data.culturalNoteEs,
      thumbnailUrl: data.thumbnailUrl,
      categoryId: data.categoryId,
      status: 'DRAFT',
      draftStep: data.draftStep ?? 'select',
      langStatusKo: data.langStatusKo ?? 'pending',
      langStatusEs: data.langStatusEs ?? 'pending',
      sources: {
        create: { url: data.sourceUrl, title: data.sourceTitle },
      },
    },
    include: { category: true, sources: true },
  });
};

export const updateArticle = async (id: string, data: Prisma.ArticleUpdateInput) => {
  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) return null;

  return prisma.article.update({
    where: { id },
    data,
    include: { category: true, sources: true },
  });
};

export const publishArticle = async (id: string) => {
  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) return null;
  if (article.status === 'PUBLISHED') return article;

  return prisma.article.update({
    where: { id },
    data: {
      status: 'PUBLISHED',
      draftStep: 'preview',
      publishedAt: new Date(),
    },
  });
};

export const deleteArticle = async (id: string) => {
  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) return null;

  return prisma.article.delete({ where: { id } });
};
