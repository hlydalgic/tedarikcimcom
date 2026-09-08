"use client";

import { PwaInstallBanner } from "@/components/pwa/PwaInstallBanner";
import { PwaInstallProvider } from "@/components/pwa/PwaInstallProvider";

export function StorefrontPwa({ children }: { children: React.ReactNode }) {
  return (
    <PwaInstallProvider>
      {children}
      <PwaInstallBanner />
    </PwaInstallProvider>
  );
}
