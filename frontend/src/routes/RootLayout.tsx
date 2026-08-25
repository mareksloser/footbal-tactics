import { Link, Outlet } from '@tanstack/react-router';
import { apiMode } from '@/api';
import { Button } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';

export function RootLayout() {
  const { isEditor, logout } = useAuth();

  return (
    <div className="min-h-full">
      <header className="relative overflow-hidden border-b border-edge">
        <div className="board-stripe pointer-events-none absolute -inset-x-10 -inset-y-40 opacity-100" />
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-linear-[90deg,var(--color-amber),var(--color-deep)_60%,transparent]" />
        <div className="relative mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-5">
          <Link to="/library" className="mr-auto">
            <p className="text-[11px] font-bold tracking-[0.22em] text-amber-soft uppercase">Taktická tabule</p>
            <p className="text-xl font-extrabold tracking-tight">Knihovna taktik</p>
          </Link>
          <span className="rounded-md border border-edge bg-panel px-2 py-0.5 text-[11px] font-bold tracking-wider text-muted uppercase">
            {apiMode === 'local' ? 'lokální data' : 'API'}
          </span>
          {isEditor ? (
            <Button onClick={() => void logout()}>Zamknout úpravy</Button>
          ) : (
            <Link
              to="/login"
              search={{ redirect: '/library' }}
              className="rounded-lg border border-edge bg-panel px-3.5 py-2 text-sm font-semibold text-chalk"
            >
              Přihlásit trenéra
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 pb-16">
        <Outlet />
      </main>
    </div>
  );
}
