"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

const TOAST_LIFETIME_MS = 5000;

const ICONS = { achievement: "🏆", golden: "✨", info: "🍪" };

function Toast({ toast, dispatch }) {
  const { id } = toast;

  useEffect(() => {
    const timer = setTimeout(() => dispatch({ type: "DISMISS_TOAST", id }), TOAST_LIFETIME_MS);
    return () => clearTimeout(timer);
  }, [dispatch, id]);

  return (
    <div className="pointer-events-auto flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 text-[var(--card-foreground)] shadow-lg">
      <span className="text-2xl leading-none" aria-hidden="true">
        {ICONS[toast.kind] ?? ICONS.info}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">{toast.title}</p>
        {toast.text && <p className="text-sm text-[var(--muted-foreground)]">{toast.text}</p>}
      </div>
      <button
        type="button"
        onClick={() => dispatch({ type: "DISMISS_TOAST", id })}
        aria-label="Dismiss notification"
        className="rounded p-1 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default function Toasts({ toasts, dispatch }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(20rem,calc(100vw-2rem))] flex-col gap-2"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} dispatch={dispatch} />
      ))}
    </div>
  );
}
