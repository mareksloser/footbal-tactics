import { useNavigate } from '@tanstack/react-router';
import { Alert, Panel } from '@/components/ui';
import { useFolders, useTactic, useTacticMutations } from '@/api/queries';
import { RequireEditor } from '@/features/auth/RequireEditor';
import { TacticEditor } from '@/features/builder/TacticEditor';
import { useDocumentTitle } from '@/lib/documentTitle';

export function EditorScreen({ tacticId }: { tacticId: string }) {
  const navigate = useNavigate();
  const tacticQuery = useTactic(tacticId);
  const foldersQuery = useFolders();
  const { update, remove } = useTacticMutations();

  useDocumentTitle(tacticQuery.data?.title, 'úprava');

  return (
    <RequireEditor redirectTo={`/t/${tacticId}/edit`}>
      {tacticQuery.isPending ? (
        <Panel className="text-sm text-muted">Načítám taktiku…</Panel>
      ) : tacticQuery.isError || !tacticQuery.data ? (
        <Alert>Taktiku se nepodařilo načíst.</Alert>
      ) : (
        <TacticEditor
          initial={tacticQuery.data}
          folders={foldersQuery.data ?? []}
          saving={update.isPending}
          error={update.isError ? 'Uložení selhalo. Zkus to znovu.' : null}
          onSave={(tactic) => update.mutateAsync(tactic)}
          onDelete={async () => {
            if (!window.confirm('Opravdu smazat celou taktiku?')) return;
            await remove.mutateAsync(tacticId);
            void navigate({ to: '/library' });
          }}
        />
      )}
    </RequireEditor>
  );
}
