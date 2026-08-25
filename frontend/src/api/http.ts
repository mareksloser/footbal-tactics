import { parseTactic } from '@/engine/schema';
import type { Folder, Tactic } from '@/engine/types';
import { readSession } from './session';
import { ApiError, type Session, type ShareLink, type TacticSummary, type TacticsApi } from './types';

/**
 * Klient pro PHP backend. Endpointy jsou popsane v docs/api-contract.md,
 * takze backend se da dopsat pozdeji bez zasahu do aplikace.
 */
export function createHttpApi(baseUrl: string): TacticsApi {
  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = readSession()?.token;
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });

    if (response.status === 204) return undefined as T;

    const payload = (await response.json().catch(() => null)) as
      | { error?: { message?: string; code?: string } }
      | T
      | null;

    if (!response.ok) {
      const error = (payload as { error?: { message?: string; code?: string } })?.error;
      throw new ApiError(error?.message ?? 'Požadavek selhal', response.status, error?.code);
    }
    return payload as T;
  }

  return {
    login: (password) => request<Session>('/auth/login', { method: 'POST', body: JSON.stringify({ password }) }),
    logout: () => request<void>('/auth/logout', { method: 'POST', body: '{}' }),

    listFolders: () => request<Folder[]>('/folders'),
    createFolder: (input) => request<Folder>('/folders', { method: 'POST', body: JSON.stringify(input) }),
    renameFolder: (id, name) =>
      request<Folder>(`/folders/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) }),
    moveFolder: (id, parentId) =>
      request<Folder>(`/folders/${id}`, { method: 'PATCH', body: JSON.stringify({ parentId }) }),
    deleteFolder: (id) => request<void>(`/folders/${id}`, { method: 'DELETE' }),

    listTactics: () => request<TacticSummary[]>('/tactics'),
    getTactic: async (id) => parseTactic(await request<unknown>(`/tactics/${id}`)),
    createTactic: async (tactic) =>
      parseTactic(await request<unknown>('/tactics', { method: 'POST', body: JSON.stringify(tactic) })),
    updateTactic: async (tactic) =>
      parseTactic(
        await request<unknown>(`/tactics/${tactic.id}`, { method: 'PUT', body: JSON.stringify(tactic) }),
      ),
    deleteTactic: (id) => request<void>(`/tactics/${id}`, { method: 'DELETE' }),

    createShare: (tacticId) =>
      request<ShareLink>(`/tactics/${tacticId}/share`, { method: 'POST', body: '{}' }),
    getShared: async (token) => parseTactic(await request<unknown>(`/shared/${token}`)),
  } satisfies TacticsApi;
}

export type { Tactic };
