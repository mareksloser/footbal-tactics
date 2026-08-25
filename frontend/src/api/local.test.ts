import { beforeEach, describe, expect, it } from 'vitest';
import { createLocalApi } from './local';
import { ApiError } from './types';
import { createTactic } from '@/engine/factory';

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key) => map.get(key) ?? null,
    key: (index) => [...map.keys()][index] ?? null,
    removeItem: (key) => void map.delete(key),
    setItem: (key, value) => void map.set(key, value),
  } as Storage;
}

describe('localApi', () => {
  let api: ReturnType<typeof createLocalApi>;

  beforeEach(() => {
    api = createLocalApi({ password: 'trener', storage: memoryStorage() });
  });

  it('naplni knihovnu vychozim obsahem', async () => {
    const tactics = await api.listTactics();
    expect(tactics.length).toBeGreaterThan(0);
    expect((await api.listFolders()).length).toBeGreaterThan(0);
  });

  it('prihlasi spravnym heslem a odmitne spatne', async () => {
    await expect(api.login('trener')).resolves.toMatchObject({ token: expect.any(String) });
    await expect(api.login('spatne')).rejects.toBeInstanceOf(ApiError);
  });

  it('ulozi a nacte taktiku', async () => {
    const created = await api.createTactic(createTactic({ title: 'Přečíslení' }));
    const loaded = await api.getTactic(created.id);
    expect(loaded.title).toBe('Přečíslení');
  });

  it('smazani slozky presune taktiky do korene a smaze podslozky', async () => {
    const parent = await api.createFolder({ name: 'Obrana', parentId: null });
    const child = await api.createFolder({ name: 'Auty', parentId: parent.id });
    const tactic = await api.createTactic(createTactic({ folderId: child.id }));

    await api.deleteFolder(parent.id);

    const folders = await api.listFolders();
    expect(folders.some((folder) => folder.id === child.id)).toBe(false);
    expect((await api.getTactic(tactic.id)).folderId).toBeNull();
  });

  it('sdileny odkaz vraci stejnou taktiku', async () => {
    const tactic = await api.createTactic(createTactic({ title: 'Vysoké míče' }));
    const link = await api.createShare(tactic.id);
    expect((await api.getShared(link.token)).id).toBe(tactic.id);
    await expect(api.getShared('neexistuje')).rejects.toBeInstanceOf(ApiError);
  });

  it('nacteni neexistujici taktiky selze', async () => {
    await expect(api.getTactic('nic')).rejects.toBeInstanceOf(ApiError);
  });
});
