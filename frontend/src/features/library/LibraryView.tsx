import { Link, useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { Alert, Button, Dialog, Field, Input, Panel } from '@/components/ui';
import { useFolderMutations, useFolders, useTactics } from '@/api/queries';
import { useAuth } from '@/features/auth/AuthProvider';
import { FolderTree } from './FolderTree';
import { buildTree, canMoveFolder, folderPath, searchTactics, tacticsIn } from './tree';

export function LibraryView({ folderId }: { folderId: string | null }) {
  const navigate = useNavigate();
  const { isEditor } = useAuth();
  const foldersQuery = useFolders();
  const tacticsQuery = useTactics();
  const mutations = useFolderMutations();

  const [query, setQuery] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const folders = foldersQuery.data ?? [];
  const tactics = tacticsQuery.data ?? [];
  const tree = useMemo(() => buildTree(folders, tactics), [folders, tactics]);
  const path = folderPath(folders, folderId);
  const visibleFolders = folderId
    ? (tree.flatMap(flatten).find((node) => node.folder.id === folderId)?.children ?? [])
    : tree;
  const visibleTactics = query ? searchTactics(tactics, query) : tacticsIn(tactics, folderId);

  const go = (next: string | null) =>
    navigate(next ? { to: '/library/$folderId', params: { folderId: next } } : { to: '/library' });

  return (
    <div className="grid gap-6 md:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="space-y-3">
        <Panel className="p-3">
          <FolderTree nodes={tree} activeId={folderId} rootCount={tactics.length} onSelect={go} />
        </Panel>
        {isEditor ? (
          <Button className="w-full" onClick={() => setShowNewFolder(true)}>
            + Nová složka
          </Button>
        ) : null}
      </aside>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <nav className="flex items-center gap-1 text-sm text-muted">
            <button type="button" className="hover:text-chalk" onClick={() => go(null)}>
              Knihovna
            </button>
            {path.map((folder) => (
              <span key={folder.id} className="flex items-center gap-1">
                <span aria-hidden>/</span>
                <button type="button" className="hover:text-chalk" onClick={() => go(folder.id)}>
                  {folder.name}
                </button>
              </span>
            ))}
          </nav>
          <div className="ml-auto flex gap-2">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Hledat taktiku…"
              className="w-48"
              aria-label="Hledat taktiku"
            />
            {isEditor ? (
              <Link
                to="/new"
                search={{ folderId: folderId ?? undefined }}
                className="rounded-lg bg-linear-[114deg,var(--color-amber),var(--color-deep)] px-3.5 py-2 text-sm font-bold text-[#1a1204]"
              >
                + Taktika
              </Link>
            ) : null}
          </div>
        </div>

        {foldersQuery.isError || tacticsQuery.isError ? <Alert>Knihovnu se nepodařilo načíst.</Alert> : null}

        {!query && visibleFolders.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {visibleFolders.map((node) => (
              <button
                key={node.folder.id}
                type="button"
                onClick={() => go(node.folder.id)}
                className="rounded-xl border border-edge bg-panel p-4 text-left transition hover:border-[#42525f]"
              >
                <p className="font-bold">📁 {node.folder.name}</p>
                <p className="mt-1 text-xs text-muted">{node.totalTactics} taktik</p>
              </button>
            ))}
          </div>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {visibleTactics.map((tactic) => (
            <Link
              key={tactic.id}
              to="/t/$tacticId"
              params={{ tacticId: tactic.id }}
              className="rounded-xl border border-edge bg-panel p-4 transition hover:border-[#42525f]"
            >
              <p className="font-bold">{tactic.title}</p>
              {tactic.description ? (
                <p className="mt-1 line-clamp-2 text-xs text-muted">{tactic.description}</p>
              ) : null}
              <p className="mt-2 text-[11px] tracking-wider text-muted uppercase">
                {tactic.scenarioCount} situací
              </p>
            </Link>
          ))}
        </div>

        {visibleTactics.length === 0 && visibleFolders.length === 0 ? (
          <Panel className="text-sm text-muted">
            {query ? 'Nic neodpovídá hledání.' : 'Tady zatím nic není. Založ první taktiku.'}
          </Panel>
        ) : null}

        {isEditor && folderId ? (
          <div className="flex flex-wrap gap-2 border-t border-edge pt-4">
            <Button
              onClick={() => {
                const name = window.prompt('Nový název složky', path.at(-1)?.name ?? '');
                if (name) mutations.rename.mutate({ id: folderId, name });
              }}
            >
              Přejmenovat složku
            </Button>
            <Button
              onClick={() => {
                const parent = window.prompt('ID cílové složky (prázdné = kořen)', '') || null;
                if (canMoveFolder(folders, folderId, parent)) {
                  mutations.move.mutate({ id: folderId, parentId: parent });
                } else {
                  window.alert('Složku nelze přesunout do sebe ani do své podsložky.');
                }
              }}
            >
              Přesunout složku
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (window.confirm('Smazat složku i podsložky? Taktiky se přesunou do kořene.')) {
                  mutations.remove.mutate(folderId);
                  go(null);
                }
              }}
            >
              Smazat složku
            </Button>
          </div>
        ) : null}
      </section>

      <Dialog open={showNewFolder} title="Nová složka" onClose={() => setShowNewFolder(false)}>
        <div className="space-y-3">
          <Field label="Název" hint={folderId ? 'Vznikne uvnitř aktuální složky.' : 'Vznikne v kořeni knihovny.'}>
            <Input value={newFolderName} onChange={(event) => setNewFolderName(event.target.value)} autoFocus />
          </Field>
          <Button
            variant="primary"
            disabled={!newFolderName.trim() || mutations.create.isPending}
            onClick={async () => {
              await mutations.create.mutateAsync({ name: newFolderName.trim(), parentId: folderId });
              setNewFolderName('');
              setShowNewFolder(false);
            }}
          >
            Vytvořit
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

function flatten(node: ReturnType<typeof buildTree>[number]): ReturnType<typeof buildTree> {
  return [node, ...node.children.flatMap(flatten)];
}
