import Image from "next/image";
import { AppLink } from "@/components/ui/AppLink";
import { Star } from "lucide-react";

type ProductSellerCardProps = {
  shopName: string;
  shopSlug: string;
  shopLogoUrl: string | null;
  shopRatingAvg: number | null;
  shopRatingCount: number;
  shopProductCount: number;
};

export function ProductSellerCard({
  shopName,
  shopSlug,
  shopLogoUrl,
  shopRatingAvg,
  shopRatingCount,
  shopProductCount,
}: ProductSellerCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center gap-3">
        {shopLogoUrl ? (
          <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-background">
            <Image
              src={shopLogoUrl}
              alt={shopName}
              fill
              className="object-cover"
              sizes="48px"
            />
          </div>
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-sm font-bold text-primary">
            {shopName.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <AppLink
            href={`/magaza/${shopSlug}`}
            className="font-semibold text-ink hover:text-primary"
          >
            {shopName}
          </AppLink>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-muted">
            {shopRatingAvg != null ? (
              <span className="inline-flex items-center gap-0.5">
                <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                {shopRatingAvg.toFixed(1)}
                <span>({shopRatingCount})</span>
              </span>
            ) : null}
            <span>{shopProductCount} ürün</span>
          </div>
        </div>
      </div>
    </div>
  );
}
