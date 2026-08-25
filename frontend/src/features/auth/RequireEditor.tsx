import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { Panel } from '@/components/ui';
import { useAuth } from './AuthProvider';

/**
 * Klientska zabrana pro editacni obrazovky.
 * Skutecne prava vynucuje backend - token se posila v Authorization hlavicce.
 */
export function RequireEditor({ children, redirectTo }: { children: ReactNode; redirectTo: string }) {
  const { isEditor } = useAuth();
  if (isEditor) return <>{children}</>;

  return (
    <Panel className="mx-auto mt-10 max-w-md text-center">
      <h2 className="text-lg font-bold">Úpravy jsou zamčené</h2>
      <p className="mt-2 text-sm text-muted">Pro editaci taktik je potřeba zadat heslo trenéra.</p>
      <Link
        to="/login"
        search={{ redirect: redirectTo }}
        className="mt-4 inline-block rounded-lg bg-linear-[114deg,var(--color-amber),var(--color-deep)] px-4 py-2 text-sm font-bold text-[#1a1204]"
      >
        Zadat heslo
      </Link>
    </Panel>
  );
}
