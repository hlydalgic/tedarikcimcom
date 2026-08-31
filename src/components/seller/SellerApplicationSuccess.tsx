import { CheckCircle2 } from "lucide-react";
import { BrandMark } from "@/components/branding/BrandMark";

type Props = {
  shortName: string;
  logoUrl: string | null;
  marketplaceName: string;
};

export function SellerApplicationSuccess({
  shortName,
  logoUrl,
  marketplaceName,
}: Props) {
  return (
    <div className="text-center">
      <BrandMark shortName={shortName} logoUrl={logoUrl} className="text-2xl" />

      <div className="mx-auto mt-8 max-w-md rounded-2xl border border-border bg-background p-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
          <CheckCircle2 className="h-7 w-7 text-accent" aria-hidden />
        </div>
        <h2 className="mt-5 font-display text-xl font-bold text-ink">
          Başvurunuz alındı
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          Başvurunuz incelemeye alındı. 1-3 iş günü içinde size dönüş
          yapılacaktır. Sonuç {marketplaceName} tarafından e-posta ile
          iletilecektir.
        </p>
      </div>
    </div>
  );
}
