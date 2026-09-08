import Link from "next/link";

export default function CategorySlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
      <Link
        href="/"
        prefetch={true}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      >
        Ana sayfa
      </Link>
      {children}
    </div>
  );
}
