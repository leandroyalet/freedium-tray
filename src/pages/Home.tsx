import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import ArticleFromUrl from "../components/article/ArticleFromUrl";

const Home: React.FC = () => {
  const [currentUrl, setCurrentUrl] = useState<string>("");

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const text = event.clipboardData?.getData("text")?.trim();

      if (!text) return;

      try {
        const parsed = new URL(text);

        if (parsed.protocol === "https:") {
          event.preventDefault();

          parsed.search = "";

          setCurrentUrl(parsed.href);
        }
      } catch {
        // invalid url
      }
    };

    listen("initial-url", (event) => {
      if (event.payload) {
        console.log("Received event from backend:", event.payload);
        setCurrentUrl(event.payload as string);
      }
    });

    window.addEventListener("paste", handlePaste);

    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background">
      <main className="flex-1 min-h-0 overflow-y-auto">
        <ArticleFromUrl url={currentUrl} />
      </main>
    </div>
  );
};

export default Home;
