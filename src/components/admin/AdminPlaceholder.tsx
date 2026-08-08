type PlaceholderProps = {
  title: string;
  description: string;
};

export function AdminPlaceholder({ title, description }: PlaceholderProps) {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
        {title}
      </h1>
      <p className="mt-2 text-sm text-ink-muted">{description}</p>
      <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center text-sm text-ink-muted">
        Bu bölüm bir sonraki sprintte bağlanacak.
      </div>
    </div>
  );
}
