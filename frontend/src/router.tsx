import {
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from '@tanstack/react-router';
import { RootLayout } from '@/routes/RootLayout';
import { LibraryScreen } from '@/routes/LibraryScreen';
import { TacticScreen } from '@/routes/TacticScreen';
import { EditorScreen } from '@/routes/EditorScreen';
import { NewTacticScreen } from '@/routes/NewTacticScreen';
import { ShareScreen } from '@/routes/ShareScreen';
import { LoginScreen } from '@/routes/LoginScreen';

const rootRoute = createRootRoute({ component: RootLayout });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/library' });
  },
});

const libraryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/library',
  component: () => <LibraryScreen />,
});

const libraryFolderRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/library/$folderId',
  component: function LibraryFolder() {
    const { folderId } = libraryFolderRoute.useParams();
    return <LibraryScreen folderId={folderId} />;
  },
});

const tacticRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/t/$tacticId',
  validateSearch: (search: Record<string, unknown>): { share?: string } => ({
    share: typeof search.share === 'string' ? search.share : undefined,
  }),
  component: function TacticView() {
    const { tacticId } = tacticRoute.useParams();
    const { share } = tacticRoute.useSearch();
    return <TacticScreen tacticId={tacticId} shareToken={share} />;
  },
});

const editorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/t/$tacticId/edit',
  component: function TacticEdit() {
    const { tacticId } = editorRoute.useParams();
    return <EditorScreen tacticId={tacticId} />;
  },
});

const newTacticRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/new',
  validateSearch: (search: Record<string, unknown>): { folderId?: string } => ({
    folderId: typeof search.folderId === 'string' ? search.folderId : undefined,
  }),
  component: function NewTactic() {
    const { folderId } = newTacticRoute.useSearch();
    return <NewTacticScreen folderId={folderId} />;
  },
});

const shareRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/share',
  component: ShareScreen,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : '/library',
  }),
  component: function Login() {
    const { redirect: target } = loginRoute.useSearch();
    return <LoginScreen redirect={target} />;
  },
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  libraryRoute,
  libraryFolderRoute,
  tacticRoute,
  editorRoute,
  newTacticRoute,
  shareRoute,
  loginRoute,
]);

export const router = createRouter({ routeTree, defaultPreload: 'intent' });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
