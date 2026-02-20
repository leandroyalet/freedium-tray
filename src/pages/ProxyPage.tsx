import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { listen } from "@tauri-apps/api/event";
import ArticleFromUrl from "../components/article/ArticleFromUrl";

const ProxyPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const url = params.get("url");

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const text = event.clipboardData?.getData("text")?.trim();
      if (!text) return;

      try {
        const parsed = new URL(text);

        if (parsed.protocol === "https:") {
          event.preventDefault();
          parsed.search = "";
          navigate(`/proxy?url=${encodeURIComponent(parsed.href)}`);
        }
      } catch {}
    };

    const unlistenPromise = listen("initial-url", (event) => {
      if (event.payload) {
        navigate(`/proxy?url=${encodeURIComponent(event.payload as string)}`);
      }
    });

    window.addEventListener("paste", handlePaste);

    return () => {
      window.removeEventListener("paste", handlePaste);
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, [navigate]);

  if (!url) {
    return <div className="mt-10 text-center">Paste a URL above.</div>;
  }

  return <ArticleFromUrl url={url} />;
};

export default ProxyPage;
