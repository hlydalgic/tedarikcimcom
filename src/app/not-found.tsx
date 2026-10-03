import type { Metadata } from "next";
import { FileQuestion } from "lucide-react";
import { NotFoundPanel } from "@/components/layout/NotFoundPanel";

export const metadata: Metadata = {
  title: "Sayfa bulunamadı",
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <NotFoundPanel
        icon={FileQuestion}
        title="Sayfa bulunamadı"
        message="Aradığınız sayfa taşınmış, kaldırılmış veya hiç var olmamış olabilir."
        primaryAction={{ href: "/", label: "Ana Sayfaya Dön" }}
      />
    </main>
  );
}
