import Link from "next/link";
import { requireUser } from "@/lib/auth/require-user";

export default async function HesabimLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser("/hesabim/profil");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
      <nav className="mb-8 flex gap-4 text-sm">
        <Link
          href="/hesabim/profil"
          className="font-semibold text-primary"
        >
          Profil
        </Link>
      </nav>
      {children}
    </div>
  );
}
