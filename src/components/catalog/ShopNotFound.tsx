import { Store } from "lucide-react";
import { NotFoundPanel } from "@/components/layout/NotFoundPanel";

export function ShopNotFound() {
  return (
    <NotFoundPanel
      icon={Store}
      title="Mağaza bulunamadı"
      message="Aradığınız mağaza artık mevcut değil."
      primaryAction={{ href: "/", label: "Alışverişe Devam Et" }}
    />
  );
}
