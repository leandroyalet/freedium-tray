import React from "react";
import { useNavigate } from "react-router-dom";
import { ArticleSummary } from "../../types";
import { formatSmartDate } from "../../utils/formatting";

interface Props {
  article: ArticleSummary;
  onContextMenu?: (e: React.MouseEvent, article: ArticleSummary) => void;
}

const ArticleRow: React.FC<Props> = ({ article, onContextMenu }) => {
  const navigate = useNavigate();

  const handleTagClick = (e: React.MouseEvent, tag: string) => {
    e.stopPropagation();
    navigate(`/?q=%23${tag}`);
  };

  const handleClick = () => {
    navigate(`/article/${article.slug}`);
  };

  const handleDoubleClick = () => {
    navigate(`/article/${article.slug}`);
  };

  return (
    <article
      className="group max-w-md flex flex-col h-full
          dark:bg-neutral-900
          rounded-xl overflow-hidden shadow-sm border border-neutral-200 dark:border-neutral-800 
          hover:shadow-md transition-shadow duration-200 cursor-pointer
          hover:bg-neutral-50 dark:hover:bg-zinc-800"
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu?.(e, article);
      }}
    >
      <div className="aspect-video w-full overflow-hidden relative">
        <img
          src={article.coverImage}
          alt={article.title}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
          <img
            src={article.author.avatar}
            alt={article.author.name}
            className="w-5 h-5 rounded-full"
          />
          <span className="truncate">by {article.author.name}</span>
        </div>

        <h2 className="text-xl font-semibold leading-snug text-neutral-900 dark:text-white group-hover:underline my-1">
          {article.title}
        </h2>

        <p className="text-neutral-600 dark:text-neutral-400 text-sm line-clamp-3">
          {article.subtitle}
        </p>

        {article.tags && article.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {article.tags.slice(0, 3).map((tag) => (
              <button
                key={tag}
                onClick={(e) => handleTagClick(e, tag)}
                className="px-2 py-0.5 text-xs rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-700 dark:hover:text-blue-200 transition-colors"
              >
                #{tag}
              </button>
            ))}
            {article.tags.length > 3 && (
              <span className="px-2 py-0.5 text-xs text-neutral-400">
                +{article.tags.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="mt-auto pt-4 text-xs text-neutral-500 dark:text-neutral-500">
          {formatSmartDate(article.publishedDate)}
        </div>
      </div>
    </article>
  );
};

export default ArticleRow;
