import { Link } from '@tanstack/react-router';
import { Alert, Button, Panel } from '@/components/ui';
import { useSharedTactic, useTactic } from '@/api/queries';
import { useAuth } from '@/features/auth/AuthProvider';
import { TacticPlayer } from '@/features/player/TacticPlayer';
import { ViewWidthSelect } from '@/features/player/ViewWidthSelect';
import { useViewWidth, VIEW_WIDTH_CLASSES } from '@/features/player/viewWidth';

export function TacticScreen({ tacticId, shareToken }: { tacticId: string; shareToken?: string }) {
  const { isEditor } = useAuth();
  const [viewWidth, setViewWidth] = useViewWidth();
  const direct = useTactic(tacticId, !shareToken);
  const shared = useSharedTactic(shareToken ?? '');
  const query = shareToken ? shared : direct;

  if (query.isPending) return <Panel className="text-sm text-muted">Načítám taktiku…</Panel>;
  if (query.isError || !query.data) return <Alert>Taktiku se nepodařilo načíst.</Alert>;

  const tactic = query.data;

  return (
      <div>
        <div className="mb-4 flex flex-wrap items-start gap-3">
          <div className="mr-auto">
            <h1 className="text-2xl font-extrabold tracking-tight">{tactic.title}</h1>
            {tactic.description ? <p className="mt-1 max-w-2xl text-sm text-muted">{tactic.description}</p> : null}
          </div>
          <ViewWidthSelect value={viewWidth} onChange={setViewWidth} />
          {isEditor && !shareToken ? (
              <Link
                  to="/t/$tacticId/edit"
                  params={{ tacticId }}
                  className="rounded-lg bg-linear-[114deg,var(--color-amber),var(--color-deep)] px-3.5 py-2 text-sm font-bold text-[#1a1204]"
              >
                Upravit
              </Link>
          ) : null}
          <Link to="/library">
            <Button>Zpět do knihovny</Button>
          </Link>
        </div>

        <TacticPlayer
            scenarios={tactic.scenarios}
            players={tactic.players}
            pitchClassName={VIEW_WIDTH_CLASSES[viewWidth]}
        />
      </div>
  );
}