import Image from "next/image";
import Link from "next/link";
import { splitBrandShortName } from "@/lib/branding/split-short-name";

type BrandMarkProps = {
  shortName: string;
  logoUrl?: string | null;
  className?: string;
  href?: string;
  invert?: boolean;
};

function Wordmark({
  shortName,
  className,
  invert,
}: {
  shortName: string;
  className?: string;
  invert?: boolean;
}) {
  const { lead, tail } = splitBrandShortName(shortName);

  if (!tail) {
    return (
      <span
        className={`font-display font-normal tracking-tight ${
          invert ? "text-white" : "text-primary"
        } ${className ?? ""}`}
      >
        {shortName.toLocaleLowerCase("tr")}
      </span>
    );
  }

  return (
    <span className={`font-display tracking-tight ${className ?? ""}`}>
      <span
        className={`font-normal ${invert ? "text-white" : "text-primary"}`}
      >
        {lead.toLocaleLowerCase("tr")}
      </span>
      <span className="font-bold text-accent">
        {tail.toLocaleLowerCase("tr")}
      </span>
    </span>
  );
}

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
    <Wordmark shortName={shortName} className={className} invert={invert} />
  );

  return (
    <Link href={href} className="inline-flex shrink-0 items-center">
      {content}
    </Link>
  );
}
