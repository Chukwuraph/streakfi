"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import clsx from "clsx";

type ToastTone = "success" | "info" | "warn" | "error";

interface Toast {
  id: string;
  tone: ToastTone;
  title: string;
  body?: string;
  href?: string;
  hrefLabel?: string;
}

interface ToastContextValue {
  push: (t: Omit<Toast, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

const TONE_STYLES: Record<ToastTone, { bg: string; border: string; icon: string; color: string }> = {
  success: {
    bg: "bg-tertiary-container/20",
    border: "border-tertiary/40",
    icon: "check_circle",
    color: "text-tertiary",
  },
  info: {
    bg: "bg-secondary-container/30",
    border: "border-secondary/40",
    icon: "bolt",
    color: "text-secondary",
  },
  warn: {
    bg: "bg-primary-container/20",
    border: "border-primary/40",
    icon: "warning",
    color: "text-primary-container",
  },
  error: {
    bg: "bg-error-container/20",
    border: "border-error/40",
    icon: "error",
    color: "text-error",
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { id, ...t }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed top-24 right-4 md:right-6 z-[70] flex flex-col gap-3 w-[calc(100%-2rem)] max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <ToastRow key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastRow({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const style = TONE_STYLES[toast.tone];
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      className={clsx(
        "pointer-events-auto rounded-xl border p-4 backdrop-blur-xl shadow-2xl animate-slide-in-top",
        "bg-surface-container/90",
        style.border,
      )}
      role="status"
    >
      <div className="flex items-start gap-3">
        <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", style.bg)}>
          <span className={clsx("material-symbols-outlined text-sm", style.color)} style={{ fontVariationSettings: "'FILL' 1" }}>
            {style.icon}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black uppercase tracking-tight text-sm text-on-surface">{toast.title}</p>
          {toast.body && <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{toast.body}</p>}
          {toast.href && (
            <a
              href={toast.href}
              target={toast.href.startsWith("http") ? "_blank" : undefined}
              rel="noreferrer"
              className={clsx("inline-block mt-2 text-[10px] font-black uppercase tracking-widest underline", style.color)}
            >
              {toast.hrefLabel ?? "Open →"}
            </a>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="text-on-surface-variant hover:text-on-surface text-xs"
          aria-label="Dismiss"
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
    </div>
  );
}
