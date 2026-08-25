import { createHttpApi } from './http';
import { createLocalApi } from './local';
import type { TacticsApi } from './types';

const mode = import.meta.env.VITE_API_MODE ?? 'local';

export const apiMode: 'local' | 'http' = mode === 'http' ? 'http' : 'local';

export const api: TacticsApi =
  apiMode === 'http'
    ? createHttpApi(import.meta.env.VITE_API_URL ?? '/api')
    : createLocalApi({ password: import.meta.env.VITE_EDIT_PASSWORD ?? 'trener' });

export * from './types';
