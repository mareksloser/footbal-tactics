import { describe, expect, it } from 'vitest';
import type { Folder } from '@/engine/types';
import type { TacticSummary } from '@/api/types';
import { buildTree, canMoveFolder, folderPath, searchTactics, tacticsIn } from './tree';

const folders: Folder[] = [
  { id: 'a', name: 'Obrana', parentId: null },
  { id: 'b', name: 'Standardky', parentId: 'a' },
  { id: 'c', name: 'Rohy', parentId: 'b' },
  { id: 'd', name: 'Útok', parentId: null },
  { id: 'x', name: 'Osiřelá', parentId: 'neexistuje' },
];

const tactic = (id: string, folderId: string | null, title = id): TacticSummary => ({
  id,
  title,
  folderId,
  scenarioCount: 1,
  updatedAt: '2026-01-01T00:00:00.000Z',
});

const tactics: TacticSummary[] = [
  tactic('t1', 'a', 'Zastupování'),
  tactic('t2', 'c', 'Bránění rohů'),
  tactic('t3', null, 'Rozehra'),
];

describe('buildTree', () => {
  const tree = buildTree(folders, tactics);

  it('sestavi rekurzivni strom', () => {
    const obrana = tree.find((n) => n.folder.id === 'a')!;
    expect(obrana.children[0]!.folder.id).toBe('b');
    expect(obrana.children[0]!.children[0]!.folder.id).toBe('c');
  });

  it('scita taktiky vcetne podslozek', () => {
    const obrana = tree.find((n) => n.folder.id === 'a')!;
    expect(obrana.tactics).toHaveLength(1);
    expect(obrana.totalTactics).toBe(2);
  });

  it('osirelou slozku zaradi do korene', () => {
    expect(tree.some((n) => n.folder.id === 'x')).toBe(true);
  });

  it('radi podle ceske abecedy', () => {
    expect(tree.map((n) => n.folder.name)).toEqual(['Obrana', 'Osiřelá', 'Útok']);
  });
});

describe('tacticsIn', () => {
  it('vraci taktiky bez slozky pro koren', () => {
    expect(tacticsIn(tactics, null).map((t) => t.id)).toEqual(['t3']);
  });
});

describe('folderPath', () => {
  it('vraci cestu od korene', () => {
    expect(folderPath(folders, 'c').map((f) => f.id)).toEqual(['a', 'b', 'c']);
  });

  it('pro koren vraci prazdnou cestu', () => {
    expect(folderPath(folders, null)).toEqual([]);
  });

  it('neskonci v nekonecne smycce pri cyklu', () => {
    const cyclic: Folder[] = [
      { id: '1', name: 'a', parentId: '2' },
      { id: '2', name: 'b', parentId: '1' },
    ];
    expect(folderPath(cyclic, '1')).toHaveLength(2);
  });
});

describe('canMoveFolder', () => {
  it('zakaze presun do sebe', () => {
    expect(canMoveFolder(folders, 'a', 'a')).toBe(false);
  });

  it('zakaze presun do potomka', () => {
    expect(canMoveFolder(folders, 'a', 'c')).toBe(false);
  });

  it('povoli presun do korene i vedlejsi vetve', () => {
    expect(canMoveFolder(folders, 'a', null)).toBe(true);
    expect(canMoveFolder(folders, 'b', 'd')).toBe(true);
  });
});

describe('searchTactics', () => {
  it('hleda bez ohledu na velikost pismen', () => {
    expect(searchTactics(tactics, 'zastup').map((t) => t.id)).toEqual(['t1']);
  });

  it('prazdny dotaz vraci nic', () => {
    expect(searchTactics(tactics, '  ')).toEqual([]);
  });
});
