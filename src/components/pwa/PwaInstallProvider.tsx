"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  dismissPwaBanner,
  isIosDevice,
  isMobileViewport,
  isPwaBannerDismissed,
  isStandaloneDisplayMode,
  type BeforeInstallPromptEvent,
} from "@/lib/pwa/install-utils";
import { PwaIosInstallModal } from "@/components/pwa/PwaIosInstallModal";

type PwaInstallContextValue = {
  promptInstall: () => Promise<void>;
  dismissBanner: () => void;
  canShowBanner: boolean;
};

const PwaInstallContext = createContext<PwaInstallContextValue | null>(null);

export function usePwaInstall(): PwaInstallContextValue {
  const context = useContext(PwaInstallContext);
  if (!context) {
    throw new Error("usePwaInstall must be used within PwaInstallProvider");
  }
  return context;
}

export function PwaInstallProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [iosModalOpen, setIosModalOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(true);
  const [isStandalone, setIsStandalone] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const syncState = () => {
      setIsStandalone(isStandaloneDisplayMode());
      setIsMobile(isMobileViewport());
      setBannerDismissed(isPwaBannerDismissed());
    };

    syncState();

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const mobileQuery = window.matchMedia("(max-width: 767px)");
    const onMobileChange = () => syncState();

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    mobileQuery.addEventListener("change", onMobileChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      mobileQuery.removeEventListener("change", onMobileChange);
    };
  }, []);

  const dismissBanner = useCallback(() => {
    dismissPwaBanner();
    setBannerDismissed(true);
  }, []);

  const promptInstall = useCallback(async () => {
    if (isStandaloneDisplayMode()) return;

    if (isIosDevice()) {
      setIosModalOpen(true);
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const canShowBanner = useMemo(
    () => !isStandalone && isMobile && !bannerDismissed,
    [bannerDismissed, isMobile, isStandalone]
  );

  const value = useMemo(
    () => ({
      promptInstall,
      dismissBanner,
      canShowBanner,
    }),
    [canShowBanner, dismissBanner, promptInstall]
  );

  return (
    <PwaInstallContext.Provider value={value}>
      {children}
      {iosModalOpen ? (
        <PwaIosInstallModal onClose={() => setIosModalOpen(false)} />
      ) : null}
    </PwaInstallContext.Provider>
  );
}
