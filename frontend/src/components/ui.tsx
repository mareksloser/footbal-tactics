import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type ButtonVariant = 'primary' | 'ghost' | 'danger';

const buttonStyles: Record<ButtonVariant, string> = {
  primary: 'bg-linear-[114deg,var(--color-amber),var(--color-deep)] text-[#1a1204] border-transparent font-bold',
  ghost: 'bg-panel text-chalk border-edge hover:border-[#42525f] hover:bg-panel-soft',
  danger: 'bg-panel text-[#ff8b8b] border-edge hover:border-[#7a3030] hover:bg-[#241618]',
};

export function Button({
  variant = 'ghost',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      {...props}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45',
        buttonStyles[variant],
        className,
      )}
    />
  );
}

export function IconButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <Button {...props} className={cn('h-10 w-10 px-0 text-base', className)} />
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'w-full rounded-lg border border-edge bg-panel px-3 py-2 text-sm text-chalk placeholder:text-muted/70',
        className,
      )}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        'w-full resize-y rounded-lg border border-edge bg-panel px-3 py-2 text-sm leading-relaxed text-chalk placeholder:text-muted/70',
        className,
      )}
    />
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] font-extrabold tracking-[0.18em] text-muted uppercase">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('rounded-xl border border-edge bg-panel/70 p-4', className)}>{children}</div>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mt-6 mb-2.5 text-[12px] font-extrabold tracking-[0.2em] text-muted uppercase">{children}</h2>
  );
}

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-md border border-edge bg-panel px-2 py-0.5 text-[11px] font-bold tracking-wider text-muted uppercase">
      {children}
    </span>
  );
}

export function Alert({ tone = 'error', children }: { tone?: 'error' | 'info'; children: ReactNode }) {
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'rounded-lg border px-3 py-2 text-sm',
        tone === 'error'
          ? 'border-[#7a3030] bg-[#241618] text-[#ffb4b4]'
          : 'border-edge bg-panel text-muted',
      )}
    >
      {children}
    </p>
  );
}

export function Dialog({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-2xl border border-edge bg-panel p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="text-base font-bold">{title}</h3>
          <IconButton onClick={onClose} aria-label="Zavřít">
            ✕
          </IconButton>
        </div>
        {children}
      </div>
    </div>
  );
}
