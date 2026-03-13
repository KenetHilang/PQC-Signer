import type { ReactNode } from 'react';

interface SectionCardProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  tone?: 'default' | 'accent';
}

export default function SectionCard({
  eyebrow,
  title,
  description,
  actions,
  children,
  tone = 'default',
}: SectionCardProps) {
  return (
    <section
      className="rounded-[28px] border border-white/50 bg-[rgba(255,250,241,0.92)] p-5 shadow-[0_24px_60px_rgba(34,24,9,0.12)] md:p-6"
      style={
        tone === 'accent'
          ? {
              background:
                'linear-gradient(180deg, rgba(214, 107, 45, 0.08), transparent 42%), rgba(255, 250, 241, 0.92)',
            }
          : undefined
      }
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          {eyebrow ? (
            <p className="mb-2 text-[0.8rem] uppercase tracking-[0.18em] text-[rgba(24,32,29,0.55)]">{eyebrow}</p>
          ) : null}
          <h2 className="m-0 text-2xl leading-tight text-[color:var(--ink)]">{title}</h2>
          {description ? <p className="mt-3 max-w-[62ch] leading-7 text-[color:var(--muted)]">{description}</p> : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
