import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Article, CommandError } from "../../types";
import { invoke } from "@tauri-apps/api/core";
import ArticleViewer from "./ArticleViewer";
import { getMirror } from "../../utils/mirror";
import { useToast } from "../../contexts/ToastContext";

interface Props {
  url: string;
}

const ArticleFromUrl: React.FC<Props> = ({ url }) => {
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [error, setError] = useState<CommandError | null>(null);
  const { showError } = useToast();

  useEffect(() => {
    if (!url) {
      return;
    }

    const load = async () => {
      try {
        const mirror = await getMirror();
        const result = await invoke<Article>("fetch_via_proxy", {
          url,
          mirror,
        });
        setArticle(result);
        await invoke("add_to_history", { articleUrl: url });
      } catch (err) {
        const commandError = err as CommandError;
        if (commandError.statusCode === 400 && commandError.message.includes("mirror")) {
          navigate("/settings");
        } else if (commandError.statusCode >= 400 && commandError.statusCode < 500) {
          setError(commandError);
        } else {
          showError(commandError.message || String(err));
        }
      }
    };

    load();
  }, [url]);

  return (
    <>
      {error && (
        <div className="flex justify-center mt-20 text-red-500">
          {error.message}
        </div>
      )}
      <ArticleViewer article={article} loading={!article && !error} />
    </>
  );
};

export default ArticleFromUrl;
