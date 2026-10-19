import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { CheckCircle2, X, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

type Toast = { id: number; message: string; type: ToastType };

let toastId = 0;
const listeners = new Set<(toasts: Toast[]) => void>();
let toasts: Toast[] = [];

function emit() {
  listeners.forEach((l) => l([...toasts]));
}

export function toast(message: string, type: ToastType = 'success') {
  const id = ++toastId;
  toasts = [...toasts, { id, message, type }];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, 3200);
}

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const colors = {
  success: 'text-success-600 bg-success-50 border-success-100',
  error: 'text-error-600 bg-error-50 border-error-100',
  info: 'text-brand-600 bg-brand-50 border-brand-100',
};

function ToastContainer() {
  useEffect(() => {
    const l = (next: Toast[]) => {
      const el = document.getElementById('toast-root');
      if (!el) return;
      createRoot(el).render(
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 w-80">
          {next.map((t) => {
            const Icon = icons[t.type];
            return (
              <div
                key={t.id}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-card-hover animate-slide-up ${colors[t.type]}`}
              >
                <Icon size={18} className="shrink-0" />
                <span className="text-sm font-medium flex-1">{t.message}</span>
                <X
                  size={14}
                  className="cursor-pointer opacity-60 hover:opacity-100"
                  onClick={() => {
                    toasts = toasts.filter((x) => x.id !== t.id);
                    emit();
                  }}
                />
              </div>
            );
          })}
        </div>
      );
    };
    listeners.add(l);
    l([...toasts]);
    return () => {
      listeners.delete(l);
    };
  }, []);

  return null;
}

export function ToastHost() {
  return (
    <>
      <div id="toast-root" />
      <ToastContainer />
    </>
  );
}
