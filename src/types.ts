export type ArticleSummary = {
  slug: string;
  url: string;
  title: string;
  subtitle: string;
  coverImage: string;
  author: {
    name: string;
    avatar: string;
    profileUrl: string;
  };
  readingTime: string | null;
  publishedDate: string;
  tags?: string[];
};

export type Article = ArticleSummary & {
  content: string;
};

export type CommandError = {
  statusCode: number;
  error: string;
  message: string;
};

export type HistoryEntry = {
  id: number;
  articleSlug: string;
  visitedAt: string;
  article?: {
    title: string;
    author: { avatar: string };
  } | null;
};

export type TagCount = {
  name: string;
  count: number;
};

export type SearchResult = {
  articles: ArticleSummary[];
  count: number;
};
