import type { Folder } from '@/engine/types';
import type { TacticSummary } from '@/api/types';

export interface FolderNode {
  folder: Folder;
  children: FolderNode[];
  tactics: TacticSummary[];
  /** Pocet taktik vcetne vsech podslozek. */
  totalTactics: number;
}

/** Postavi rekurzivni strom slozek. Osirele slozky (chybi rodic) skonci v korenu. */
export function buildTree(folders: readonly Folder[], tactics: readonly TacticSummary[]): FolderNode[] {
  const known = new Set(folders.map((f) => f.id));
  const byParent = new Map<string | null, Folder[]>();
  for (const folder of folders) {
    const parent = folder.parentId && known.has(folder.parentId) ? folder.parentId : null;
    const list = byParent.get(parent) ?? [];
    list.push(folder);
    byParent.set(parent, list);
  }

  const seen = new Set<string>();
  const build = (parentId: string | null): FolderNode[] =>
    (byParent.get(parentId) ?? [])
      .filter((folder) => !seen.has(folder.id))
      .sort((a, b) => a.name.localeCompare(b.name, 'cs'))
      .map((folder) => {
        seen.add(folder.id);
        const children = build(folder.id);
        const own = tacticsIn(tactics, folder.id);
        return {
          folder,
          children,
          tactics: own,
          totalTactics: own.length + children.reduce((sum, child) => sum + child.totalTactics, 0),
        };
      });

  return build(null);
}

export function tacticsIn(tactics: readonly TacticSummary[], folderId: string | null): TacticSummary[] {
  return tactics
    .filter((tactic) => (tactic.folderId ?? null) === folderId)
    .sort((a, b) => a.title.localeCompare(b.title, 'cs'));
}

/** Cesta od korene ke slozce - pro drobeckovou navigaci. */
export function folderPath(folders: readonly Folder[], folderId: string | null): Folder[] {
  const byId = new Map(folders.map((f) => [f.id, f]));
  const path: Folder[] = [];
  const guard = new Set<string>();
  let current = folderId ? byId.get(folderId) : undefined;
  while (current && !guard.has(current.id)) {
    guard.add(current.id);
    path.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return path;
}

export function descendantIds(folders: readonly Folder[], folderId: string): Set<string> {
  const result = new Set<string>([folderId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const folder of folders) {
      if (folder.parentId && result.has(folder.parentId) && !result.has(folder.id)) {
        result.add(folder.id);
        changed = true;
      }
    }
  }
  return result;
}

/** Slozku nelze presunout do sebe ani do sveho potomka. */
export function canMoveFolder(
  folders: readonly Folder[],
  folderId: string,
  targetId: string | null,
): boolean {
  if (targetId === null) return true;
  if (targetId === folderId) return false;
  return !descendantIds(folders, folderId).has(targetId);
}

export function searchTactics(tactics: readonly TacticSummary[], query: string): TacticSummary[] {
  const needle = query.trim().toLocaleLowerCase('cs');
  if (!needle) return [];
  return tactics.filter((tactic) =>
    [tactic.title, tactic.description ?? '', ...(tactic.tags ?? [])]
      .join(' ')
      .toLocaleLowerCase('cs')
      .includes(needle),
  );
}
