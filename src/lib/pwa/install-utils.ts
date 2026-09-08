export const PWA_BANNER_DISMISSED_KEY = "pwa-banner-dismissed";

export const IOS_PWA_INSTALL_STEPS = [
  "Alt menüden □↑ Paylaş'a bas",
  '"Ana Ekrana Ekle"yi seç',
  '"Ekle"ye bas',
] as const;

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function isStandaloneDisplayMode(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator &&
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true)
  );
}

export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 767px)").matches;
}

export function isPwaBannerDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(PWA_BANNER_DISMISSED_KEY) === "1";
}

export function dismissPwaBanner(): void {
  window.localStorage.setItem(PWA_BANNER_DISMISSED_KEY, "1");
}
