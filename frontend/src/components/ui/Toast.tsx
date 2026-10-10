"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<ToastItem, "id">) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<ToastItem, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const duration = toast.duration ?? 4000;
    const newToast: ToastItem = { ...toast, id };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const showSuccess = useCallback((message: string, title?: string) => {
    showToast({ type: "success", message, title });
  }, [showToast]);

  const showError = useCallback((message: string, title?: string) => {
    showToast({ type: "error", message, title });
  }, [showToast]);

  const showWarning = useCallback((message: string, title?: string) => {
    showToast({ type: "warning", message, title });
  }, [showToast]);

  const showInfo = useCallback((message: string, title?: string) => {
    showToast({ type: "info", message, title });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo }}>
      {children}
      {/* Toast Render Container Top Right */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-md w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => {
          const icons = {
            success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
            error: <XCircle className="w-5 h-5 text-rose-600 shrink-0" />,
            warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
            info: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
          };

          const borders = {
            success: "border-emerald-200 bg-emerald-50/95 text-emerald-950",
            error: "border-rose-200 bg-rose-50/95 text-rose-950",
            warning: "border-amber-200 bg-amber-50/95 text-amber-950",
            info: "border-blue-200 bg-blue-50/95 text-blue-950",
          };

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${borders[t.type]}`}
            >
              <div className="mt-0.5">{icons[t.type]}</div>
              <div className="flex-1 space-y-0.5">
                {t.title && <h5 className="font-bold text-xs leading-tight">{t.title}</h5>}
                <p className="text-xs font-medium leading-relaxed">{t.message}</p>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      showToast: () => {},
      showSuccess: (msg: string) => typeof window !== "undefined" && console.log("[Success]:", msg),
      showError: (msg: string) => typeof window !== "undefined" && console.error("[Error]:", msg),
      showWarning: (msg: string) => typeof window !== "undefined" && console.warn("[Warning]:", msg),
      showInfo: (msg: string) => typeof window !== "undefined" && console.info("[Info]:", msg),
    };
  }
  return context;
}
