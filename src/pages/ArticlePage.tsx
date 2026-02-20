import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import ArticleViewer from "../components/article/ArticleViewer";
import { Article, CommandError } from "../types";

const ArticlePage = () => {
  const { id } = useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [error, setError] = useState<CommandError | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      return;
    }

    loadArticle(id);
  }, [id]);

  const loadArticle = async (articleId: string) => {
    try {
      const data = await invoke<Article>("get_article_by_slug", {
        slug: articleId,
      });

      setArticle(data);
      await invoke("add_to_history", { articleUrl: data.url });
    } catch (err) {
      const commandError = err as CommandError;
      if (commandError.statusCode === 404) {
        setError(commandError);
      } else {
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error && (
        <div className="flex justify-center mt-20 text-red-500">
          {error.message}
        </div>
      )}
      <ArticleViewer article={article} loading={loading} />
    </>
  );
};

export default ArticlePage;
