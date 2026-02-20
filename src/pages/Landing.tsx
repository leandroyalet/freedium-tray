import { invoke } from "@tauri-apps/api/core";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { Copy, ExternalLink, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DeleteModal from "../components/article/DeleteModal";
import ContextMenu from "../components/ContextMenu";
import ResultList from "../components/ResultList";
import { Article, ArticleSummary, SearchResult, TagCount } from "../types";

const LIMIT = 6;

const Landing = () => {
  const [params] = useSearchParams();
  const query = params.get("q") || "";
  const navigate = useNavigate();

  const [results, setResults] = useState<ArticleSummary[]>([]);
  const [recent, setRecent] = useState<ArticleSummary[]>([]);
  const [popularTags, setPopularTags] = useState<TagCount[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [articleToDelete, setArticleToDelete] = useState<ArticleSummary | null>(
    null,
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    article: ArticleSummary;
  } | null>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPopularTags();
  }, []);

  useEffect(() => {
    setPage(0);
    setHasMore(true);
    setResults([]);
    setRecent([]);
    setTotalCount(null);

    if (!query.trim()) {
      loadRecent(0);
    } else {
      searchArticles(query, 0);
    }
  }, [query]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 },
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, page, query]);

  const loadRecent = async (pageNum: number) => {
    try {
      setLoading(true);
      const data = await invoke<Article[]>("get_recent_articles", {
        limit: LIMIT,
        offset: pageNum * LIMIT,
      });

      if (pageNum === 0) {
        setRecent(data);
      } else {
        setRecent((prev) => [...prev, ...data]);
      }

      setHasMore(data.length === LIMIT);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadPopularTags = async () => {
    try {
      const data = await invoke<TagCount[]>("get_popular_tags", { limit: 10 });
      setPopularTags(data);
    } catch (err) {
      console.error(err);
    }
  };

  const searchArticles = async (q: string, pageNum: number) => {
    try {
      setLoading(true);
      const { articles, count } = await invoke<SearchResult>("search_articles", {
        query: q,
        limit: LIMIT,
        offset: pageNum * LIMIT,
      });

      if (pageNum === 0) {
        setResults(articles);
        setTotalCount(count);
      } else {
        setResults((prev) => [...prev, ...articles]);
      }

      setHasMore(articles.length === LIMIT);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);

    if (!query.trim()) {
      loadRecent(nextPage);
    } else {
      searchArticles(query, nextPage);
    }
  }, [page, query]);

  const handleTagClick = (tag: string) => {
    navigate(`/?q=%23${tag}`);
  };

  const handleContextMenu = (e: React.MouseEvent, article: ArticleSummary) => {
    setContextMenu({ x: e.clientX, y: e.clientY, article });
  };

  const handleCopyUrl = async (url: string) => {
    try {
      console.log(url);
      await writeText(url);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  const handleOpenArticle = (slug: string) => {
    navigate(`/article/${slug}`);
  };

  const handleDeleteArticle = async () => {
    if (!articleToDelete) return;

    try {
      await invoke("delete_article", { slug: articleToDelete.slug });
      setArticleToDelete(null);
      setShowDeleteModal(false);

      if (!query.trim()) {
        setRecent((prev) =>
          prev.filter((a) => a.slug !== articleToDelete.slug),
        );
      } else {
        setResults((prev) =>
          prev.filter((a) => a.slug !== articleToDelete.slug),
        );
      }
    } catch (err) {
      console.error("Failed to delete article:", err);
    }
  };

  const isTagSearch = query.startsWith("#");
  const list = query.trim() ? results : recent;

  return (
    <div className="mx-auto px-6 select-none">
      {!query && popularTags.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-3">
            Popular Tags
          </h2>
          <div className="flex flex-wrap gap-2">
            {popularTags.map((tag) => (
              <button
                key={tag.name}
                onClick={() => handleTagClick(tag.name)}
                className="px-3 py-1.5 text-sm rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-700 dark:hover:text-blue-200 transition-colors"
              >
                #{tag.name}
                <span className="ml-1.5 text-xs text-neutral-400 dark:text-neutral-500">
                  {tag.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {query && (
        <h2 className="mt-6 text-md text-neutral-500 dark:text-neutral-400">
          {isTagSearch
            ? `Articles tagged "${query.slice(1)}"${totalCount !== null ? ` (${totalCount})` : ""}`
            : `Results for "${query}"${totalCount !== null ? ` (${totalCount})` : ""}`}
        </h2>
      )}

      {!loading && list.length === 0 && (
        <p className="text-neutral-500 dark:text-neutral-400 py-8">
          No articles found.
        </p>
      )}

      {!query && list.length > 0 && (
        <h1 className="dark:text-white mt-6">Recently added</h1>
      )}

      <ResultList articles={list} onContextMenu={handleContextMenu} />

      {hasMore && (
        <div ref={loaderRef} className="py-8 flex justify-center">
          {loading && (
            <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
          )}
        </div>
      )}

      <DeleteModal
        isOpen={showDeleteModal}
        articleTitle={articleToDelete?.title || ""}
        onConfirm={handleDeleteArticle}
        onCancel={() => {
          setShowDeleteModal(false);
          setArticleToDelete(null);
        }}
      />

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={[
            {
              label: "Open article",
              icon: <ExternalLink size={16} />,
              onClick: () => handleOpenArticle(contextMenu.article.slug),
            },
            {
              label: "Copy original URL",
              icon: <Copy size={16} />,
              onClick: () => handleCopyUrl(contextMenu.article.url),
            },
            {
              label: "Delete article",
              icon: <Trash2 size={16} />,
              onClick: () => {
                setArticleToDelete(contextMenu.article);
                setShowDeleteModal(true);
              },
              danger: true,
            },
          ]}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};

export default Landing;
