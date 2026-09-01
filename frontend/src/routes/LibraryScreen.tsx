import { useFolders } from '@/api/queries';
import { folderPath } from '@/features/library/tree';
import { LibraryView } from '@/features/library/LibraryView';
import { useDocumentTitle } from '@/lib/documentTitle';

export function LibraryScreen({ folderId = null }: { folderId?: string | null }) {
  const foldersQuery = useFolders();
  const path = folderPath(foldersQuery.data ?? [], folderId);

  useDocumentTitle(
      path.length ? path.map((folder) => folder.name).join(' / ') : 'Knihovna taktik',
  );

  return <LibraryView folderId={folderId} />;
}
