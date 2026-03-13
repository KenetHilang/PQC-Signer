import type { ToastItem } from '@/lib/types';

interface ToastRegionProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

const toastTone: Record<ToastItem['type'], string> = {
  success: 'border-l-[color:var(--success)]',
  warning: 'border-l-[color:var(--warning)]',
  error: 'border-l-[#a63e2f]',
};

export default function ToastRegion({ toasts, onDismiss }: ToastRegionProps) {
  return (
    <div className="sticky top-4 z-20 mb-5 grid justify-items-end gap-2.5" aria-live="polite">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          className={[
            'flex w-full min-w-0 items-center justify-between gap-4 rounded-[18px] border-l-4 bg-[rgba(255,248,238,0.96)] px-4 py-3 text-left shadow-[0_24px_60px_rgba(34,24,9,0.12)] transition hover:-translate-y-px md:min-w-[420px]',
            toastTone[toast.type],
          ].join(' ')}
          onClick={() => onDismiss(toast.id)}
          type="button"
        >
          <span>{toast.message}</span>
          <span className="text-sm text-[color:var(--muted)]">Dismiss</span>
        </button>
      ))}
    </div>
  );
}
