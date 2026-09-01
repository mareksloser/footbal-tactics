import { useNavigate } from '@tanstack/react-router';
import { useMemo } from 'react';
import { useFolders, useTacticMutations } from '@/api/queries';
import { createTactic } from '@/engine/factory';
import { RequireEditor } from '@/features/auth/RequireEditor';
import { TacticEditor } from '@/features/builder/TacticEditor';
import { useDocumentTitle } from '@/lib/documentTitle';

export function NewTacticScreen({ folderId }: { folderId?: string }) {
  const navigate = useNavigate();
  const foldersQuery = useFolders();
  const { create } = useTacticMutations();
  const draft = useMemo(() => createTactic({ folderId: folderId ?? null }), [folderId]);

    useDocumentTitle('Nová taktika');

  return (
    <RequireEditor redirectTo="/new">
      <TacticEditor
        initial={draft}
        folders={foldersQuery.data ?? []}
        saving={create.isPending}
        error={create.isError ? 'Vytvoření selhalo. Zkus to znovu.' : null}
        onSave={async (tactic) => {
          const saved = await create.mutateAsync(tactic);
          void navigate({ to: '/t/$tacticId/edit', params: { tacticId: saved.id } });
          return saved;
        }}
      />
    </RequireEditor>
  );
}
