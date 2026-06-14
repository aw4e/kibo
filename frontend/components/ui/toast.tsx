"use client";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Toast } from "@/hooks/useToast";

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info };

const STYLES = {
  success: { bg: "bg-[#DCFCE7]", icon: "text-[#15803D]", text: "text-[#15803D]" },
  error:   { bg: "bg-[#FEE2E2]", icon: "text-[#DC2626]", text: "text-[#DC2626]" },
  info:    { bg: "bg-[#EDE9FE]", icon: "text-[#7C3AED]", text: "text-[#6D28D9]"  },
};

export function Toaster({
  toasts,
  onRemove,
}: {
  toasts: Toast[];
  onRemove: (id: number) => void;
}) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2.5 w-[320px] max-w-[calc(100vw-3rem)] pointer-events-none">
      {toasts.map((t) => {
        const s = STYLES[t.type];
        const Icon = ICONS[t.type];
        return (
          <div
            key={t.id}
            className={cn(
              "flex items-start gap-3 px-4 py-3.5 rounded-xl border-2 border-[#09090B]",
              "shadow-[3px_3px_0_#09090B] animate-slide-up pointer-events-auto",
              s.bg
            )}
          >
            <Icon className={cn("w-4 h-4 flex-shrink-0 mt-0.5", s.icon)} />
            <span className={cn("font-sans flex-1 text-[0.8125rem] font-bold leading-snug", s.text)}>
              {t.message}
            </span>
            <button
              onClick={() => onRemove(t.id)}
              className={cn("flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity", s.icon)}
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
