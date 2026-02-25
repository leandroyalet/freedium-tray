import hljs from "highlight.js";
import React, { useEffect, useRef } from "react";
import { Article } from "../../types";
import SearchInPage from "./SearchInPage";
import ArticleSkeleton from "./ArticleSkeleton";
import { formatSmartDate } from "../../utils/formatting";

interface ArticleViewerProps {
  article: Article | null;
  loading?: boolean;
}

const ArticleViewer: React.FC<ArticleViewerProps> = ({ article, loading }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading) {
      return;
    }
    if (!article || !contentRef.current) {
      return;
    }

    const blocks = contentRef.current.querySelectorAll("pre");

    blocks.forEach((pre) => {
      const codeEl = pre.querySelector("code");
      if (!codeEl) {
        return;
      }

      if (pre.querySelector(".hljs-copy")) {
        return;
      }

      hljs.highlightElement(codeEl as HTMLElement);

      const button = document.createElement("button");
      button.innerText = "Copy";
      button.className =
        "hljs-copy absolute top-2 right-5 px-2 py-1 text-xs rounded bg-gray-300 dark:bg-zinc-800";

      pre.classList.add("relative");

      button.addEventListener("click", () => {
        const code = codeEl.textContent || "";

        button.innerText = "Copying...";

        navigator.clipboard.writeText(code).then(() => {
          button.innerText = "Copied!";
          setTimeout(() => {
            button.innerText = "Copy";
          }, 1500);
        });
      });

      pre.appendChild(button);
    });

    return () => {
      blocks.forEach((pre) => {
        const btn = pre.querySelector(".hljs-copy");
        btn?.remove();
      });
    };
  }, [article, loading]);

  if (loading) {
    return (
      <>
        <div className="fixed top-12 left-16 right-4 h-1 z-50 overflow-hidden bg-transparent">
          <div className="h-full w-1/3 bg-primary animate-loading-bar" />
        </div>
        <div className="flex justify-center h-fit m-8 top-10 article">
          <ArticleSkeleton />
        </div>
      </>
    );
  }

  return (
    <div className="flex justify-center h-fit mb-8 top-10 article">
      <SearchInPage />
      {/* fake snippets to allow Tailwind to include the styles */}
      <div className="hidden">
        <div className="items-center p-2 overflow-hidden border border-gray-300 mt-7 ">
          <div className="flex flex-row justify-between p-2 overflow-hidden">
            <div className="flex flex-col justify-center p-2">
              <h2 className="text-base font-bold text-black dark:text-gray-100">
                GitHub - examples/example
              </h2>
              <div className="block mt-2">
                <h3 className="text-sm text-grey-darker">
                  Contribute to examples/example development by creating an
                  account on GitHub.
                </h3>
              </div>
              <div className="mt-5">
                <p className="text-xs text-grey-darker">github.com</p>
              </div>
            </div>
            <div className="relative flex h-40 flew-row w-60">
              <div className="absolute inset-0 bg-center bg-cover"></div>
            </div>
          </div>
        </div>
        <pre className="justify-center border mt-7 dark:border-gray-700">
          <code className="p-2 bg-gray-100 dark:bg-gray-900 overflow-x-auto"></code>
        </pre>
        <code className="p-1.5 bg-gray-300 dark:bg-gray-600"></code>
        <ul className="pl-8 mt-2 list-disc">
          <li className="mt-3"></li>
        </ul>
        <ol className="pl-8 mt-2 list-decimal">
          <li className="mt-3"></li>
        </ol>
      </div>

      <div className="text-neutral-800 dark:text-neutral-200 w-full text-xl max-w-170 mx-6">
        {article && (
          <>
            <h1 className="mb-0">{article.title}</h1>
            <h2 className="text-neutral-400 font-thin mb-8">
              {article.subtitle}
            </h2>
            <div className="flex items-center justify-start pb-8 border-b border-neutral-100">
              <div className="flex items-center">
                <img
                  src={article.author.avatar}
                  alt={article.author.name}
                  className="rounded-full size-8"
                />
                <a
                  href={article.author.profileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-2 hover:underline font-light text-sm text-neutral-700 dark:text-neutral-400 my-auto"
                >
                  {article.author.name}
                </a>
              </div>
              <div className="ml-6 text-neutral-500 text-xs">
                {article.readingTime} · {formatSmartDate(article.publishedDate)}
              </div>
            </div>
            {article.coverImage && (
              <img src={article.coverImage} className="w-full h-auto" />
            )}
            <div
              ref={contentRef}
              dangerouslySetInnerHTML={{ __html: article.content }}
            ></div>
            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 p-4">
                {article.tags.map((tag) => (
                  <a
                    key={tag}
                    href={`https://medium.com/tag/${tag}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400 hover:bg-green-500/20 transition"
                  >
                    #{tag}
                  </a>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ArticleViewer;
