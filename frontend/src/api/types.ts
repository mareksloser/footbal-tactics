import type { Folder, Tactic } from '@/engine/types';

export interface Session {
  token: string;
  expiresAt: string;
}

export interface ShareLink {
  token: string;
  /** Absolutni URL pro sdileni. */
  url: string;
}

export interface TacticSummary {
  id: string;
  title: string;
  description?: string;
  folderId: string | null;
  tags?: string[];
  scenarioCount: number;
  updatedAt: string;
}

/**
 * Jediny kontrakt mezi aplikaci a ulozistem.
 * `localApi` bezi v prohlizeci, `httpApi` mluvi s PHP backendem (docs/api-contract.md).
 */
export interface TacticsApi {
  login(password: string): Promise<Session>;
  logout(): Promise<void>;

  listFolders(): Promise<Folder[]>;
  createFolder(input: { name: string; parentId: string | null }): Promise<Folder>;
  renameFolder(id: string, name: string): Promise<Folder>;
  moveFolder(id: string, parentId: string | null): Promise<Folder>;
  deleteFolder(id: string): Promise<void>;

  listTactics(): Promise<TacticSummary[]>;
  getTactic(id: string): Promise<Tactic>;
  createTactic(tactic: Tactic): Promise<Tactic>;
  updateTactic(tactic: Tactic): Promise<Tactic>;
  deleteTactic(id: string): Promise<void>;

  createShare(tacticId: string): Promise<ShareLink>;
  getShared(token: string): Promise<Tactic>;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
