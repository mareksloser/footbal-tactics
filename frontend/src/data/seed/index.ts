import type { Folder, Tactic } from '@/engine/types';
import glasner from './glasner-palace.json';
import defense from './zastupovani-auty.json';

export const seedFolders: Folder[] = [
  { id: 'fd_vzory', name: 'Vzory z profi fotbalu', parentId: null },
  { id: 'fd_obrana', name: 'Obranná fáze', parentId: null },
  { id: 'fd_utok', name: 'Útočná fáze', parentId: null },
  { id: 'fd_standardky', name: 'Standardní situace', parentId: 'fd_obrana' },
];

/** Vychozi obsah knihovny - prevedene puvodni animace (scripts/legacy-import.mjs). */
export function seedTactics(): Tactic[] {
  return [
    { ...(glasner as unknown as Tactic), folderId: 'fd_vzory' },
    { ...(defense as unknown as Tactic), folderId: 'fd_obrana' },
  ];
}

export function seedLibrary() {
  return { folders: [...seedFolders], tactics: seedTactics(), shares: {} as Record<string, string> };
}
