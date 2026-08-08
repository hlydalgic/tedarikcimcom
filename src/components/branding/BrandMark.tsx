import Image from "next/image";
import Link from "next/link";

type BrandMarkProps = {
  shortName: string;
  logoUrl?: string | null;
  className?: string;
  href?: string;
  invert?: boolean;
};

export function BrandMark({
  shortName,
  logoUrl,
  className = "",
  href = "/",
  invert = false,
}: BrandMarkProps) {
  const content = logoUrl ? (
    <Image
      src={logoUrl}
      alt={shortName}
      width={160}
      height={40}
      className={`h-8 w-auto object-contain md:h-9 ${className}`}
      priority
    />
  ) : (
    <span
      className={`font-display font-bold tracking-tight ${
        invert ? "text-white" : "text-primary"
      } ${className}`}
    >
      {shortName}
    </span>
  );

  return (
    <Link href={href} className="inline-flex shrink-0 items-center">
      {content}
    </Link>
  );
}
