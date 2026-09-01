import { useMemo } from 'react';
import { Alert, Panel } from '@/components/ui';
import { decodeTacticFromPayload } from '@/features/share/codec';
import { TacticPlayer } from '@/features/player/TacticPlayer';
import { useDocumentTitle } from '@/lib/documentTitle';

/** Taktika prisla zabalena primo v adrese (za mrizkou) - nic se nenacita ze serveru. */
export function ShareScreen() {
  const result = useMemo(() => {
    const payload = window.location.hash.replace(/^#/, '');
    if (!payload) return { error: 'Odkaz neobsahuje žádnou taktiku.' } as const;
    try {
      return { tactic: decodeTacticFromPayload(payload) } as const;
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Odkaz se nepodařilo přečíst.' } as const;
    }
  }, []);

  if ('error' in result) return <Alert>{result.error}</Alert>;

  useDocumentTitle('error' in result ? 'Sdílená taktika' : result.tactic.title, 'sdíleno');

  return (
    <div>
      <Panel className="mb-4">
        <h1 className="text-xl font-extrabold">{result.tactic.title}</h1>
        {result.tactic.description ? (
          <p className="mt-1 text-sm text-muted">{result.tactic.description}</p>
        ) : null}
        <p className="mt-2 text-xs text-muted">Sdílená taktika — zobrazení bez možnosti úprav.</p>
      </Panel>
      <TacticPlayer scenarios={result.tactic.scenarios} players={result.tactic.players} />
    </div>
  );
}
