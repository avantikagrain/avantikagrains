export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading products</span>

      {Array.from({ length: count }, (_, i) => (
        <article key={i} className="flex flex-col">
          <div className="media animate-pulse bg-[var(--bg-raised)]" />

          <div className="mt-4 flex flex-1 flex-col">
            <div className="h-5 w-3/4 animate-pulse rounded-sm bg-[var(--bg-raised)]" />
            <div className="mt-2 h-3 w-1/3 animate-pulse rounded-sm bg-[var(--bg-raised)]" />

            <div className="mt-3 flex items-baseline gap-2.5 border-t border-[var(--hairline)] pt-3">
              <div className="h-4 w-16 animate-pulse rounded-sm bg-[var(--bg-raised)]" />
              <div className="ml-auto h-3 w-10 animate-pulse rounded-sm bg-[var(--bg-raised)]" />
            </div>

            <div className="mt-3 h-4 w-24 animate-pulse rounded-sm bg-[var(--bg-raised)]" />
          </div>
        </article>
      ))}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div
      className="mx-auto grid max-w-[86rem] gap-10 px-5 pb-10 pt-36 sm:px-8 sm:pt-44 lg:grid-cols-2 lg:gap-16"
      aria-busy="true"
    >
      <span className="sr-only">Loading product</span>
      <div className="media animate-pulse border border-[var(--hairline)] bg-[var(--bg-raised)]" />

      <div>
        <div className="h-12 w-4/5 animate-pulse rounded-sm bg-[var(--bg-raised)]" />
        <div className="mt-3 h-6 w-1/3 animate-pulse rounded-sm bg-[var(--bg-raised)]" />
        <div className="mt-7 space-y-2">
          <div className="h-4 w-full animate-pulse rounded-sm bg-[var(--bg-raised)]" />
          <div className="h-4 w-5/6 animate-pulse rounded-sm bg-[var(--bg-raised)]" />
        </div>
        <div className="mt-9 border-t border-[var(--hairline-strong)] pt-6">
          <div className="h-14 w-40 animate-pulse rounded-sm bg-[var(--bg-raised)]" />
        </div>
        <div className="mt-9 h-12 w-full animate-pulse rounded-sm bg-[var(--bg-raised)]" />
      </div>
    </div>
  );
}
