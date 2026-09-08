"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

type BottomDrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function BottomDrawer({
  open,
  onClose,
  title,
  children,
  footer,
}: BottomDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] lg:hidden" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-ink/60"
        aria-label="Kapat"
        onClick={onClose}
      />
      <div
        className="absolute inset-x-0 bottom-0 flex h-[85vh] flex-col rounded-t-2xl bg-surface shadow-lift"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bottom-drawer-title"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <h2
            id="bottom-drawer-title"
            className="font-display text-base font-bold text-ink"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold text-ink-muted transition hover:bg-background hover:text-ink"
          >
            <X className="h-4 w-4" />
            Kapat
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
        {footer ? (
          <div className="shrink-0 border-t border-border bg-surface px-4 py-3">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
