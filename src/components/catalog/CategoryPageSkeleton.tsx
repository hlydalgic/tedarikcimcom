function SidebarSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-soft">
      <div className="mb-3 h-5 w-24 animate-pulse rounded bg-background" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center gap-2.5 px-2 py-2">
            <div className="h-4 w-4 shrink-0 animate-pulse rounded-full bg-background" />
            <div
              className="h-4 animate-pulse rounded bg-background"
              style={{ width: `${68 + (index % 3) * 12}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-4 border-t border-border pt-3">
        <div className="mb-2 h-3 w-28 animate-pulse rounded bg-background" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center gap-2.5 px-2 py-2">
              <div className="h-4 w-4 shrink-0 animate-pulse rounded-full bg-background" />
              <div className="h-4 w-3/5 animate-pulse rounded bg-background" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="aspect-[4/3] animate-pulse bg-background" />
      <div className="space-y-2 p-4">
        <div className="h-3 w-1/3 animate-pulse rounded bg-background" />
        <div className="h-4 w-full animate-pulse rounded bg-background" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-background" />
        <div className="flex items-end justify-between pt-2">
          <div className="h-6 w-20 animate-pulse rounded bg-background" />
          <div className="h-8 w-16 animate-pulse rounded-lg bg-background" />
        </div>
      </div>
    </div>
  );
}

export function CategoryPageSkeleton() {
  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="h-4 w-16 animate-pulse rounded bg-background" />
        <div className="h-4 w-4 animate-pulse rounded bg-background" />
        <div className="h-4 w-24 animate-pulse rounded bg-background" />
      </div>

      <div className="mb-8">
        <div className="h-8 w-56 max-w-full animate-pulse rounded bg-background md:h-9" />
        <div className="mt-3 h-4 w-full max-w-xl animate-pulse rounded bg-background" />
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="h-4 w-20 animate-pulse rounded bg-background" />
        <div className="h-9 w-36 animate-pulse rounded-lg bg-background" />
      </div>

      <div className="mb-4 flex gap-2 lg:hidden">
        <div className="h-10 flex-1 animate-pulse rounded-xl bg-background" />
        <div className="h-10 flex-1 animate-pulse rounded-xl bg-background" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr] lg:gap-8">
        <aside className="hidden space-y-4 lg:block">
          <SidebarSkeleton />
          <div className="h-64 animate-pulse rounded-2xl bg-background" />
        </aside>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </>
  );
}
