import { useEffect, useState, useCallback } from 'react';
import { create } from 'zustand';
import { X } from 'lucide-react';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastData {
  message: string;
  action?: ToastAction;
  duration?: number;
}

interface ToastState {
  data: ToastData | null;
  timeoutId: ReturnType<typeof setTimeout> | null;
  show: (message: string, options?: { action?: ToastAction; duration?: number }) => void;
  hide: () => void;
}

export const useToast = create<ToastState>((set, get) => ({
  data: null,
  timeoutId: null,
  show: (message, options) => {
    // Clear existing timeout
    const { timeoutId } = get();
    if (timeoutId) clearTimeout(timeoutId);

    const duration = options?.duration ?? 3000;
    const newTimeoutId = setTimeout(() => {
      set({ data: null, timeoutId: null });
    }, duration);

    set({
      data: { message, action: options?.action, duration },
      timeoutId: newTimeoutId,
    });
  },
  hide: () => {
    const { timeoutId } = get();
    if (timeoutId) clearTimeout(timeoutId);
    set({ data: null, timeoutId: null });
  },
}));

export function Toast() {
  const data = useToast((s) => s.data);
  const hide = useToast((s) => s.hide);
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (data) {
      setVisible(true);
      setExiting(false);
    } else if (visible) {
      setExiting(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setExiting(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [data, visible]);

  const handleAction = useCallback(() => {
    if (data?.action) {
      data.action.onClick();
      hide();
    }
  }, [data, hide]);

  if (!visible) return null;

  return (
    <div
      className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg shadow-lg text-sm font-medium ${
        exiting ? 'animate-toast-out' : 'animate-toast-in'
      }`}
    >
      <span>{data?.message}</span>
      {data?.action && (
        <button
          onClick={handleAction}
          className="px-2 py-1 bg-accent hover:bg-accent/80 text-white rounded font-bold text-xs uppercase tracking-wider transition-[background-color,transform] active:scale-[0.96]"
        >
          {data.action.label}
        </button>
      )}
      <button
        onClick={hide}
        className="p-2.5 hover:bg-white/10 dark:hover:bg-black/10 rounded transition-[background-color,transform] active:scale-[0.96]"
      >
        <X size={14} />
      </button>
    </div>
  );
}
