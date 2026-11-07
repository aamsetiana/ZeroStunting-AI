"use client";

import React, { useState, useEffect, useCallback, createContext, useContext } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

function SingleToast({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const [isClosing, setIsClosing] = useState(false);
  const duration = toast.duration ?? 3500;

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onDismiss(toast.id);
    }, 280);
  }, [toast.id, onDismiss]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, handleClose]);

  const styleConfigs = {
    success: {
      bg: "#F0FDF4",
      border: "#86EFAC",
      text: "#15803D",
      icon: <CheckCircle2 size={19} color="#16A34A" style={{ flexShrink: 0 }} />,
      progress: "#22C55E",
      title: "Sukses",
    },
    error: {
      bg: "#FEF2F2",
      border: "#FECACA",
      text: "#B91C1C",
      icon: <AlertCircle size={19} color="#DC2626" style={{ flexShrink: 0 }} />,
      progress: "#EF4444",
      title: "Perhatian",
    },
    warning: {
      bg: "#FFFBEB",
      border: "#FDE68A",
      text: "#B45309",
      icon: <AlertTriangle size={19} color="#D97706" style={{ flexShrink: 0 }} />,
      progress: "#F59E0B",
      title: "Pemberitahuan",
    },
    info: {
      bg: "#F0F9FF",
      border: "#BAE6FD",
      text: "#0369A1",
      icon: <Info size={19} color="#0284C7" style={{ flexShrink: 0 }} />,
      progress: "#38BDF8",
      title: "Informasi",
    },
  }[toast.type];

  return (
    <div
      className={isClosing ? "toast-exit" : "toast-enter"}
      role="status"
      style={{
        position: "relative",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "13px 16px 14px 14px",
        background: styleConfigs.bg,
        border: `1.5px solid ${styleConfigs.border}`,
        borderRadius: 14,
        boxShadow: "0 8px 30px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04)",
        minWidth: 290,
        maxWidth: 420,
        overflow: "hidden",
        backdropFilter: "blur(10px)",
        pointerEvents: "auto",
        transition: "all 0.25s ease",
      }}
    >
      {/* Progress Bar Animation */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: 3,
          background: styleConfigs.progress,
          borderRadius: 4,
          animation: `toastProgress ${duration}ms linear forwards`,
          opacity: 0.85,
        }}
      />

      <div style={{ marginTop: 1 }}>{styleConfigs.icon}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: styleConfigs.text, lineHeight: 1.4 }}>
          {toast.message}
        </div>
      </div>

      <button
        type="button"
        onClick={handleClose}
        aria-label="Tutup notifikasi"
        style={{
          background: "transparent",
          border: "none",
          padding: 2,
          cursor: "pointer",
          color: "#94A3B8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 6,
          transition: "color 0.15s ease",
          marginTop: -2,
          marginRight: -4,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "#475569";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "#94A3B8";
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 24,
        right: 24,
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        pointerEvents: "none",
      }}
    >
      {toasts.map((toast) => (
        <SingleToast key={toast.id} toast={toast} onDismiss={onRemove} />
      ))}
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = "info", duration = 3500) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const success = useCallback((message: string, duration?: number) => {
    addToast(message, "success", duration);
  }, [addToast]);

  const error = useCallback((message: string, duration?: number) => {
    addToast(message, "error", duration);
  }, [addToast]);

  const warning = useCallback((message: string, duration?: number) => {
    addToast(message, "warning", duration);
  }, [addToast]);

  const info = useCallback((message: string, duration?: number) => {
    addToast(message, "info", duration);
  }, [addToast]);

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, success, error, warning, info }}
    >
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  // If inside ToastProvider
  const context = useContext(ToastContext);
  if (context) return context;

  // Fallback standalone hook if used outside ToastProvider
  const [localToasts, setLocalToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setLocalToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = "info", duration = 3500) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setLocalToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const success = useCallback((msg: string, dur?: number) => addToast(msg, "success", dur), [addToast]);
  const error = useCallback((msg: string, dur?: number) => addToast(msg, "error", dur), [addToast]);
  const warning = useCallback((msg: string, dur?: number) => addToast(msg, "warning", dur), [addToast]);
  const info = useCallback((msg: string, dur?: number) => addToast(msg, "info", dur), [addToast]);

  return {
    toasts: localToasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };
}
