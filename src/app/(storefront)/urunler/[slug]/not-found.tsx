import { PackageX } from "lucide-react";
import { NotFoundPanel } from "@/components/layout/NotFoundPanel";

export default function ProductNotFound() {
  return (
    <NotFoundPanel
      icon={PackageX}
      title="Ürün bulunamadı"
      message="Aradığınız ürün artık mevcut değil veya kaldırılmış olabilir."
      primaryAction={{ href: "/", label: "Alışverişe Devam Et" }}
      secondaryAction={{ href: "/kategoriler", label: "Kategorilere Göz At" }}
    />
  );
}
