/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_MODE?: 'local' | 'http';
  readonly VITE_API_URL?: string;
  readonly VITE_EDIT_PASSWORD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
