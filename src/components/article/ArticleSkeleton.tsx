const ArticleSkeleton = () => {
  return (
    <div className="flex justify-center w-full">
      <div className="w-full max-w-3xl px-6 py-10 animate-pulse">
        <div className="h-10 bg-neutral-300 dark:bg-neutral-700 rounded w-3/4 mb-4"></div>
        <div className="h-6 bg-neutral-300 dark:bg-neutral-700 rounded w-1/2 mb-8"></div>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-10 h-10 bg-neutral-300 dark:bg-neutral-700 rounded-full"></div>
          <div className="flex flex-col gap-2">
            <div className="h-4 bg-neutral-300 dark:bg-neutral-700 rounded w-32"></div>
            <div className="h-3 bg-neutral-300 dark:bg-neutral-700 rounded w-24"></div>
          </div>
        </div>

        <div className="w-full aspect-video bg-neutral-300 dark:bg-neutral-700 rounded-lg mb-10"></div>

        <div className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className={`h-4 bg-neutral-300 dark:bg-neutral-700 rounded ${
                i % 3 === 0 ? "w-full" : i % 3 === 1 ? "w-11/12" : "w-9/12"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ArticleSkeleton;
