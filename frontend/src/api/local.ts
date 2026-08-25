import { parseTactic } from '@/engine/schema';
import type { Folder, Tactic } from '@/engine/types';
import { createId } from '@/lib/id';
import { seedLibrary } from '@/data/seed';
import { ApiError, type Session, type ShareLink, type TacticSummary, type TacticsApi } from './types';

interface Store {
  folders: Folder[];
  tactics: Tactic[];
  shares: Record<string, string>;
}

const KEY = 'taktika.library.v1';

export interface LocalApiOptions {
  password: string;
  storage?: Storage;
  now?: () => number;
}

/**
 * Uloziste v prohlizeci. Slouzi jako plnohodnotna nahrada backendu pro vyvoj,
 * offline pouziti a testy - implementuje stejny kontrakt jako httpApi.
 */
export function createLocalApi({ password, storage, now = Date.now }: LocalApiOptions): TacticsApi {
  const store = storage ?? window.localStorage;

  function read(): Store {
    const raw = store.getItem(KEY);
    if (!raw) {
      const seeded = seedLibrary();
      write(seeded);
      return seeded;
    }
    try {
      return JSON.parse(raw) as Store;
    } catch {
      const seeded = seedLibrary();
      write(seeded);
      return seeded;
    }
  }

  function write(next: Store): void {
    store.setItem(KEY, JSON.stringify(next));
  }

  function mutate<T>(fn: (store: Store) => T): T {
    const state = read();
    const result = fn(state);
    write(state);
    return result;
  }

  // Vsechny metody jsou async, aby se chyby hlasily jako odmitnuty Promise -
  // stejne jako u sitoveho klienta.
  const delay = <T>(value: T) => Promise.resolve(value);

  return {
    login: async (input) => {
      if (input !== password) throw new ApiError('Nesprávné heslo', 401, 'invalid_password');
      const session: Session = {
        token: createId('local'),
        expiresAt: new Date(now() + 12 * 60 * 60 * 1000).toISOString(),
      };
      return delay(session);
    },
    logout: async () => delay(undefined),

    listFolders: async () => delay(read().folders),
    createFolder: async ({ name, parentId }) =>
      delay(
        mutate((state) => {
          const folder: Folder = { id: createId('fd'), name, parentId };
          state.folders.push(folder);
          return folder;
        }),
      ),
    renameFolder: async (id, name) =>
      delay(
        mutate((state) => {
          const folder = state.folders.find((f) => f.id === id);
          if (!folder) throw new ApiError('Složka nenalezena', 404);
          folder.name = name;
          return folder;
        }),
      ),
    moveFolder: async (id, parentId) =>
      delay(
        mutate((state) => {
          const folder = state.folders.find((f) => f.id === id);
          if (!folder) throw new ApiError('Složka nenalezena', 404);
          folder.parentId = parentId;
          return folder;
        }),
      ),
    deleteFolder: async (id) =>
      delay(
        mutate((state) => {
          const removed = new Set<string>([id]);
          let changed = true;
          while (changed) {
            changed = false;
            for (const folder of state.folders) {
              if (folder.parentId && removed.has(folder.parentId) && !removed.has(folder.id)) {
                removed.add(folder.id);
                changed = true;
              }
            }
          }
          state.folders = state.folders.filter((f) => !removed.has(f.id));
          for (const tactic of state.tactics) {
            if (tactic.folderId && removed.has(tactic.folderId)) tactic.folderId = null;
          }
          return undefined;
        }),
      ),

    listTactics: async () =>
      delay(
        read().tactics.map<TacticSummary>((tactic) => ({
          id: tactic.id,
          title: tactic.title,
          description: tactic.description,
          folderId: tactic.folderId,
          tags: tactic.tags,
          scenarioCount: tactic.scenarios.length,
          updatedAt: tactic.updatedAt,
        })),
      ),
    getTactic: async (id) => {
      const tactic = read().tactics.find((t) => t.id === id);
      if (!tactic) throw new ApiError('Taktika nenalezena', 404);
      return delay(parseTactic(tactic));
    },
    createTactic: async (tactic) =>
      delay(
        mutate((state) => {
          const created = parseTactic({ ...tactic, updatedAt: new Date(now()).toISOString() });
          state.tactics.push(created);
          return created;
        }),
      ),
    updateTactic: async (tactic) =>
      delay(
        mutate((state) => {
          const index = state.tactics.findIndex((t) => t.id === tactic.id);
          if (index < 0) throw new ApiError('Taktika nenalezena', 404);
          const updated = parseTactic({ ...tactic, updatedAt: new Date(now()).toISOString() });
          state.tactics[index] = updated;
          return updated;
        }),
      ),
    deleteTactic: async (id) =>
      delay(
        mutate((state) => {
          state.tactics = state.tactics.filter((t) => t.id !== id);
          return undefined;
        }),
      ),

    createShare: async (tacticId) =>
      delay(
        mutate((state) => {
          const token = createId('sh');
          state.shares[token] = tacticId;
          const link: ShareLink = {
            token,
            url: `${window.location.origin}/t/${tacticId}?share=${token}`,
          };
          return link;
        }),
      ),
    getShared: async (token) => {
      const state = read();
      const tacticId = state.shares[token];
      const tactic = state.tactics.find((t) => t.id === tacticId);
      if (!tactic) throw new ApiError('Odkaz už neplatí', 404);
      return delay(parseTactic(tactic));
    },
  } satisfies TacticsApi;
}
