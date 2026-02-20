import { useSearchParams } from "react-router-dom";
import ArticleFromUrl from "../components/article/ArticleFromUrl";

const ArticleFromUrlPage: React.FC = () => {
  const [params] = useSearchParams();
  const url = params.get("url");

  if (!url) return null;

  return (
    <main className="flex-1 min-h-0 overflow-y-auto">
      <ArticleFromUrl url={url} />
    </main>
  );
};

export default ArticleFromUrlPage;
