import React from "react";
import { ArticleSummary } from "../types";
import ArticleDetail from "./article/ArticleDetail";

interface Props {
  articles: ArticleSummary[];
  onContextMenu?: (e: React.MouseEvent, article: ArticleSummary) => void;
}

const ResultList: React.FC<Props> = ({ articles, onContextMenu }) => {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div
        className="grid gap-x-10 gap-y-14 
              grid-cols-1 
              sm:grid-cols-2 
              lg:grid-cols-3"
      >
        {articles.map((article) => (
          <ArticleDetail
            key={article.slug}
            article={article}
            onContextMenu={onContextMenu}
          />
        ))}
      </div>
    </div>
  );
};

export default ResultList;
