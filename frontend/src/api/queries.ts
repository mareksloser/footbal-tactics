import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Folder, Tactic } from '@/engine/types';
import { api } from './index';

export const queryKeys = {
  folders: ['folders'] as const,
  tactics: ['tactics'] as const,
  tactic: (id: string) => ['tactic', id] as const,
  shared: (token: string) => ['shared', token] as const,
};

export function useFolders() {
  return useQuery({ queryKey: queryKeys.folders, queryFn: () => api.listFolders() });
}

export function useTactics() {
  return useQuery({ queryKey: queryKeys.tactics, queryFn: () => api.listTactics() });
}

export function useTactic(id: string, enabled = true) {
  return useQuery({ queryKey: queryKeys.tactic(id), queryFn: () => api.getTactic(id), enabled });
}

export function useSharedTactic(token: string) {
  return useQuery({ queryKey: queryKeys.shared(token), queryFn: () => api.getShared(token) });
}

export function useFolderMutations() {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: queryKeys.folders });

  const create = useMutation({
    mutationFn: (input: { name: string; parentId: string | null }) => api.createFolder(input),
    onSuccess: invalidate,
  });
  const rename = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.renameFolder(id, name),
    onSuccess: invalidate,
  });
  const move = useMutation({
    mutationFn: ({ id, parentId }: { id: string; parentId: string | null }) => api.moveFolder(id, parentId),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.deleteFolder(id),
    onSuccess: () => {
      invalidate();
      client.invalidateQueries({ queryKey: queryKeys.tactics });
    },
  });

  return { create, rename, move, remove };
}

export function useTacticMutations() {
  const client = useQueryClient();
  const invalidate = (tactic?: Tactic) => {
    client.invalidateQueries({ queryKey: queryKeys.tactics });
    if (tactic) client.setQueryData(queryKeys.tactic(tactic.id), tactic);
  };

  const create = useMutation({
    mutationFn: (tactic: Tactic) => api.createTactic(tactic),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: (tactic: Tactic) => api.updateTactic(tactic),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.deleteTactic(id),
    onSuccess: () => invalidate(),
  });
  const share = useMutation({ mutationFn: (id: string) => api.createShare(id) });

  return { create, update, remove, share };
}

export type { Folder };
