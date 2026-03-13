import type { ReactNode } from 'react';

const variants: Record<string, string> = {
  default: 'bg-[rgba(24,32,29,0.08)] text-[color:var(--ink)]',
  accent: 'bg-[rgba(214,107,45,0.12)] text-[color:var(--accent-strong)]',
  success: 'bg-[rgba(31,122,91,0.12)] text-[color:var(--success)]',
  warning: 'bg-[rgba(181,109,16,0.13)] text-[color:var(--warning)]',
};

export default function Pill({ children, variant = 'default' }: { children: ReactNode; variant?: string }) {
  return (
    <span
      className={[
        'inline-flex min-h-8 items-center rounded-full px-3 text-[0.82rem] tracking-[0.04em]',
        variants[variant] || variants.default,
      ].join(' ')}
    >
      {children}
    </span>
  );
}
