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
    url: 'https://www.yna.co.kr/rss/society.xml',
    source: '연합뉴스',
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
  {
    url: 'https://news.sbs.co.kr/news/SectionRssFeed.do?sectionId=09',
    source: 'SBS',
    category: '스포츠',
    slug: 'sports',
  },
  {
    url: 'https://news.sbs.co.kr/news/SectionRssFeed.do?sectionId=08',
    source: 'SBS',
    category: '문화',
    slug: 'culture',
  },
];

const YOUTUBE_CHANNELS = [
  {
    channelId: 'UCpiCK8c6PBktcxq7Az_t4RQ',
    source: 'Netflix K-Content',
    category: '드라마',
    slug: 'drama',
  },
  { channelId: 'UCNIiH_4ArJNd_cDZApZ7AFg', source: 'TVING', category: '드라마', slug: 'drama' },
  { channelId: 'UC3IZKseVpdzPSBaWxBxundA', source: 'HYBE LABELS', category: 'K-POP', slug: 'kpop' },
  { channelId: 'UCeLPm9yH_a_QH8n6445G-Ow', source: 'KBS Kpop', category: 'K-POP', slug: 'kpop' },
  { channelId: 'UCtCiO5t2voB14CmZKTkIzPQ', source: '딩고뮤직', category: 'K-POP', slug: 'kpop' },
  { channelId: 'UCEf_Bc-KVd7onSeifS3py9g', source: 'SMTOWN', category: 'K-POP', slug: 'kpop' },
  { channelId: 'UC3iFLiOtLHkUYcqkEWpaLjQ', source: '올리브영', category: '스타일', slug: 'style' },
  {
    channelId: 'UC2DHU9RPlx9DpY0pMfL7jBg',
    source: 'Vogue Korea',
    category: '스타일',
    slug: 'style',
  },
  { channelId: 'UC-PHIZjV-oX8H7zD1cCN2NQ', source: 'Arirang TV', category: '뉴스', slug: 'news' },
];

const WEATHER_KEYWORDS = [
  '날씨',
  '기온',
  '기상',
  '강수',
  '태풍',
  '미세먼지',
  '폭염',
  '한파',
  '황사',
  '호우',
  '폭설',
  '천둥',
  '번개',
  '예보',
  '강풍',
];
const POLITICS_KEYWORDS = [
  '대통령',
  '국회',
  '여당',
  '야당',
  '선거',
  '민주당',
  '국민의힘',
  '의원',
  '장관',
  '총리',
  '탄핵',
  '국정감사',
  '개각',
  '정치',
  '외교부',
  '청와대',
];
const DRAMA_KEYWORDS = [
  '드라마',
  '넷플릭스',
  'OTT',
  '시즌',
  '웨이브',
  '티빙',
  '왓챠',
  '시리즈',
  '주연',
  '출연',
];

const decodeEntities = (str: string) =>
  str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'");

const collectYouTube = async (): Promise<NewsArticle[]> => {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return [];

  const articles: NewsArticle[] = [];

  await Promise.allSettled(
    YOUTUBE_CHANNELS.map(async (channel) => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channel.channelId}&part=snippet&order=date&maxResults=5&type=video&videoDuration=medium`,
          { signal: controller.signal },
        );
        clearTimeout(timeout);
        const data = (await res.json()) as {
          items?: {
            id: { videoId: string };
            snippet: { title: string; description: string; thumbnails: { high: { url: string } } };
          }[];
        };
        if (!data.items) return;
        for (const item of data.items) {
          articles.push({
            title: decodeEntities(item.snippet.title),
            summary: item.snippet.description || undefined,
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
            source: channel.source,
            category: channel.category,
            slug: channel.slug,
            thumbnailUrl: item.snippet.thumbnails.high.url,
          });
        }
      } catch {
        // 개별 채널 실패는 무시
      }
    }),
  );

  return articles;
};

export const searchNews = async () => {
  const feedResults = await Promise.allSettled(
    RSS_FEEDS.map((feed) =>
      rssParser.parseURL(feed.url).then((r) => ({ feed, items: r.items as RssItem[] })),
    ),
  );

  const articles: NewsArticle[] = [];

  for (const result of feedResults) {
    if (result.status === 'fulfilled') {
      const { feed, items } = result.value;
      items.slice(0, 5).forEach((item) => {
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

  // YouTube 수집
  const youtubeArticles = await collectYouTube();
  articles.push(...youtubeArticles);

  // DB 중복 제거 (URL + 최근 30일 제목)
  const normalizeTitle = (title: string) => title.replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();

  const urls = articles.map((a) => a.url).filter(Boolean);
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [existing, recentArticles] = await Promise.all([
    prisma.articleSource.findMany({
      where: { url: { in: urls } },
      select: { url: true },
    }),
    prisma.article.findMany({
      where: { createdAt: { gte: since } },
      select: { titleKo: true },
    }),
  ]);
  const existingUrls = new Set(existing.map((s) => s.url));

  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>(recentArticles.map((a) => normalizeTitle(a.titleKo)));
  const deduped = articles
    .filter((a) => {
      const normTitle = normalizeTitle(a.title);
      if (existingUrls.has(a.url) || seenUrls.has(a.url) || seenTitles.has(normTitle)) return false;
      seenUrls.add(a.url);
      seenTitles.add(normTitle);
      return true;
    })
    .filter((a) => a.thumbnailUrl !== null)
    .filter((a) => !WEATHER_KEYWORDS.some((kw) => a.title.includes(kw)))
    .filter((a) => !POLITICS_KEYWORDS.some((kw) => a.title.includes(kw)));

  // 연예 피드에서 드라마 관련 기사 카테고리 재분류
  for (const article of deduped) {
    if (article.category === 'K-POP' && DRAMA_KEYWORDS.some((kw) => article.title.includes(kw))) {
      article.category = '드라마';
      article.slug = 'drama';
    }
  }

  // 카테고리별로 그룹화 후 셔플
  const categoryMap = new Map<string, NewsArticle[]>();
  for (const article of deduped) {
    if (!categoryMap.has(article.category)) categoryMap.set(article.category, []);
    categoryMap.get(article.category)!.push(article);
  }
  for (const group of categoryMap.values()) {
    for (let i = group.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [group[i], group[j]] = [group[j], group[i]];
    }
  }

  // 카테고리별 최대 4개, 총 최대 24개
  const selected: NewsArticle[] = [];
  for (const group of categoryMap.values()) {
    selected.push(...group.slice(0, 4));
  }

  return selected.slice(0, 24);
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
      친숙한 말투로 작성하고, 우리 프로젝트의 마스코트는 Agent Oh-E야.
      기사에서 기자의 주관적인 내용은 빼고 객관적인 사실만 가져와서 새로운 기사로 작성해줘.
      문장 끝 어미에 "오잉"을 붙여줘. 단, 아래 규칙을 반드시 지켜줘:
      - <h2> 소제목에는 어미를 붙이지 마
      - "~이오잉", "~하오잉" 처럼 자연스럽게 붙여줘
      - 좋은 예: "발매했오잉", "기록했오잉", "예정이에오잉", "의미해오잉"
      - 나쁜 예: "의미하오잉", "파급력했오잉", "곡이오잉" (어색한 형태 금지)
      - 시작 인사말은 안녕하세요가 아니라 안녕하세오이!로 해줘
      - 마스코트 이름은 영어로 Agent Oh-E가 아니라 에이전트 오이라고 한글로 말해줘

      [제목-KO]
      한국어 제목 (태그 없이 텍스트만)

      [본문-KO]
      반드시 아래 HTML 형식으로 작성해줘. 다른 형식은 절대 사용하지 마.
      - 소제목은 <h2>태그
      - 문단은 <p>태그
      - 강조는 <strong>태그
      - 목록은 <ul><li>태그
      - 소제목 3개 이상, 각 소제목 아래 문단은 반드시 4~6문장으로 작성해줘
      - 단순 사실 나열 금지. 각 문단에 배경 설명, 의미, 맥락을 충분히 풀어써줘
      - 외국인 독자가 한국 문화를 잘 모른다고 가정하고, 용어나 문화적 맥락을 친절하게 설명해줘
      예시: <h2>소제목</h2><p>내용...</p><p>내용...</p>

      [요약-KO]
      기사 내용과 관련된 간단한 한국 문화 설명 (태그 없이 텍스트만)
    `;
  } else {
    prompt = `
      # Corea Hoy — LATAM Localization Editor

      ## 역할 및 목표
      너는 Corea Hoy의 LATAM 콘텐츠 에디터다.
      Corea Hoy는 K-pop, 드라마, 음식, 라이프스타일 등 한국 문화를
      라틴아메리카 독자에게 소개하는 K-culture 큐레이션 서비스다.

      작업 목표: 한국어 원문을 읽고, LATAM 독자를 위한 콘텐츠로 재작성한다.
      번역이 아니라 재작성이다.
      문장 구조, 표현, 순서는 자유롭게 바꾸되
      핵심 사실(날짜, 수치, 이름, 주요 내용)은 반드시 유지한다.

      결과물을 읽었을 때 "AI가 번역한 한국 기사"가 아니라
      "LATAM K-culture 미디어가 직접 쓴 콘텐츠"처럼 느껴져야 한다.

      ---

      ## Agent Oh-E
      Corea Hoy의 마스코트. 한국에서 직접 소식을 전하는 친근한 가이드.
      밝고 가볍지만 독자를 어리게 대하지 않는다.

      규칙:
      - 도입부 첫 단락에서 1~2문장으로 자연스럽게 등장
      - 반드시 <h2> 소제목 밖, 독립된 <p> 단락으로 위치할 것
      - 수식어 남용 금지. 간결하게 시작할 것
      - 과몰입 금지. 이후 본문에서는 등장하지 않음

      좋은 예:
      - "Hola, soy Agent Oh-E y hoy les traigo noticias desde Corea."
      - "Desde Seúl, Agent Oh-E con lo último del mundo K-pop."

      나쁜 예:
      - "hoy les traigo una novedad emocionante directamente desde Corea."
        → "emocionante", "directamente" 같은 군더더기 수식어 금지
      - "jiii~" / "holaaaaaa" / 과도한 애교 / 유아적 말투
      - <h2> 소제목 안에 도입문이 포함되는 구조

      ---

      ## 톤 & 스타일
      목표 레퍼런스: Soompi en Español, Noticias Kpop 같은
      실제 LATAM K-culture 미디어 계정 스타일

      - 구어체에 가깝지만 SNS 잡담 수준은 아님
      - 짧고 리듬감 있는 문장
      - 수치는 리스트가 아닌 문장 안에 자연스럽게 녹일 것
        나쁜 예: 불릿으로 수치만 나열
        좋은 예: "Ya superó el millón de copias en preventa y el video
        de coreografía llegó a 10 millones de vistas en 24 horas.
        No es poca cosa."
      - 독자에게 맥락과 관점을 제공하는 문장 환영
        예) "Para ponerlo en perspectiva: el álbum todavía no existe
        físicamente y ya tiene más ventas que muchos artistas
        en toda su carrera."
      - 이모지는 강조나 전환이 필요한 곳에만. 문장마다 붙이지 않음

      ---

      ## 언어 규칙

      사용할 것:
      - 라틴아메리카 스페인어 (스페인 스페인어 표현 지양)
      - comeback, idol, fan sign, showcase 등 K-pop 영어 용어는 그대로 유지
      - 처음 등장하는 K-pop 전문 용어는 본문 또는 Tip cultural에서 설명 추가

      피할 것:
      - 한국어 말버릇 직역 ("오잉", "~지", 애교 표현 등)
      - diminutivo 남용 (cabecita, amiguito, horitas, cositas 등)
      - 문자 반복 (holaaaa, llegandoooo, increibleeee 등)
      - 감탄사 남발 (yay, uwu, omg, ¡Increíble! 반복 사용)
      - 과도한 클릭베이트성 표현
      - 번역체 문장 구조 유지
      - 국기 이모티콘 사용 금지

      ---

      ## Few-shot 예시

      아래는 좋은 현지화와 나쁜 현지화의 예시다. 이 방향을 참고해서 재작성한다.

      예시 1 — 감탄사 처리:
      원문: "무려 1억 뷰를 돌파했다!"
      나쁜 예: "¡¡¡Superó los 100 millones de vistas, increíble!!!"
      좋은 예: "Ya superó los 100 millones de vistas. No es poca cosa."

      예시 2 — 도입부 처리:
      원문: "오잉? IVE가 컴백한다고?!"
      나쁜 예: "¿Oig? ¿IVE hace comeback?!"
      좋은 예: "IVE acaba de confirmar su comeback y la espera terminó."

      예시 3 — 전체 문장 재작성:
      원문: "이번 앨범은 정말 많은 분들이 기다리셨을 텐데요, 드디어 나왔습니다!"
      나쁜 예: "¡Este álbum que muchas personas esperaban, por fin salió!"
      좋은 예: "El álbum que todos venían esperando ya está aquí."

      예시 4 — 수치에 맥락 추가:
      원문: "선주문 100만 장을 돌파했다."
      나쁜 예 (리스트 나열):
        <ul>
          <li>Las preventas superaron el millón de copias.</li>
          <li>El video alcanzó 10 millones de vistas.</li>
        </ul>
      좋은 예 (문장으로 통합):
        "Ya superó el millón de copias en preventa y el video de
        coreografía llegó a 10 millones de vistas en solo 24 horas.
        No es poca cosa."

      예시 5 — Agent Oh-E 구조:
      나쁜 예:
        <h2>IVE confirma su regreso</h2>
        <p>Hola, soy Agent Oh-E...</p>
      좋은 예:
        <p>Hola, soy Agent Oh-E y hoy les traigo noticias desde Corea.</p>
        <h2>IVE confirma su regreso</h2>

      ---

      ## 출력 형식
      반드시 아래 구조와 HTML 형식으로 출력한다.
      구조 순서를 바꾸지 말 것.

      제목: [제목]

      본문:
      <p>[Agent Oh-E 도입 1~2문장. h2 소제목 이전에 독립 단락으로]</p>

      <h2>[소제목]</h2>
      <p>[단락]</p>

      <h2>[소제목]</h2>
      <p>[단락]</p>

      <h2>💡 Tip cultural de Agent Oh-E</h2>
      <p>[문화/용어 설명 도입 문장]</p>
      <ul>
        <li><strong>용어 또는 개념</strong>: 설명 (2~3문장. 정의 + 왜 이 문화가 존재하는지 맥락 포함)</li>
        <li><strong>용어 또는 개념</strong>: 설명 (2~3문장. 정의 + 맥락 포함)</li>
        <li><strong>용어 또는 개념</strong>: 설명 (2~3문장. 정의 + 맥락 포함)</li>
      </ul>

      문화 설명: [2~3문장]

      ---

      ## 💡 Tip cultural 섹션 규칙
      필수 섹션이다. 반드시 포함할 것.

      - 본문 요약 금지. 독자가 처음 접하는 한국/K-pop 문화 개념을 설명
      - 대상: K-pop 입문자도 이해할 수 있어야 함
      - 분량: 개념 2~3개, 각각 2~3문장으로 설명
      - 단순 정의에 그치지 말고 왜 이 문화가 존재하는지 맥락까지 설명
      - 본문 주제와 연결된 개념 우선 선택
      - ul 태그로 끝낼 것. 섹션 마지막에 추가 단락 금지

      ## 제목 규칙
      - 짧고 눈에 띄게, SNS 콘텐츠 스타일
      - 수치나 구체적 정보가 있으면 적극 활용
      - 클릭을 유도하되 과도한 클릭베이트 금지
      - 감탄사로 시작하는 제목 지양

      좋은 예:
      - "IVE está de vuelta: 'IVE SWITCH' ya tiene un millón de preventas"
      - "El comeback de IVE que nadie esperaba... y que todos necesitaban"

      나쁜 예:
      - "¡¡¡IVE VUELVE Y ES INCREÍBLE!!!"
      - "¡WOW! ¡IVE está de vuelta con todo!"

      ---

      제목: ${data.titleKo}
      본문: ${data.bodyKo}

      아래 형식을 정확히 지켜서 출력해줘:

      [제목-ES]
      Título en español (sin etiquetas HTML, solo texto)

      [본문-ES]
      Usa <h2> para subtítulos, <p> para párrafos, <strong> para énfasis, <ul><li> para listas.

      [요약-ES]
      Resumen en una oración (sin etiquetas HTML, solo texto)
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
      const is500 = msg.includes('500') || msg.includes('INTERNAL');
      if (attempt < 5 && (is503 || is429 || is500)) {
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

  const [articles, total, counts] = await Promise.all([
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
    prisma.article.groupBy({
      by: ['status'],
      _count: { status: true },
    }),
  ]);

  const countMap = {
    total: counts.reduce((acc, curr) => acc + curr._count.status, 0),
    DRAFT: counts.find((c) => c.status === 'DRAFT')?._count.status || 0,
    PUBLISHED: counts.find((c) => c.status === 'PUBLISHED')?._count.status || 0,
    ARCHIVED: counts.find((c) => c.status === 'ARCHIVED')?._count.status || 0,
  };

  return {
    articles,
    counts: countMap,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const getAdminArticleById = async (id: string) => {
  return prisma.article.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      sources: true,
      _count: { select: { likes: true, comments: true } },
    },
  });
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
  const existingSource = await prisma.articleSource.findFirst({
    where: { url: data.sourceUrl },
  });
  if (existingSource) return null;

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
