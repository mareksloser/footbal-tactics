import { LibraryView } from '@/features/library/LibraryView';

export function LibraryScreen({ folderId = null }: { folderId?: string | null }) {
  return <LibraryView folderId={folderId} />;
}
