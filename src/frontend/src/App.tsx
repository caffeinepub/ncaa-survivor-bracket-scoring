import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { useEffect } from "react";
import Footer from "./components/Footer";
import Header from "./components/Header";
import { useActor } from "./hooks/useActor";
import { getLocalTeams, setLocalTeams } from "./lib/teamStore";
import Admin from "./pages/Admin";
import EntryDetail from "./pages/EntryDetail";
import EntryForm from "./pages/EntryForm";
import Home from "./pages/Home";
import Leaderboard from "./pages/Leaderboard";

function TeamAutoLoader() {
  const { actor, isFetching } = useActor();

  useEffect(() => {
    if (!actor || isFetching) return;
    const existing = getLocalTeams();
    if (existing.length > 0) return;
    // Auto-load teams from backend when localStorage is empty
    actor
      .getTeams()
      .then((allTeams) => {
        if (allTeams.length > 0) {
          setLocalTeams(
            allTeams.map((t) => ({
              id: Number(t.id),
              name: t.name,
              seed: Number(t.seed),
            })),
          );
        }
      })
      .catch(() => {
        // Silently ignore — teams may not be seeded yet
      });
  }, [actor, isFetching]);

  return null;
}

const rootRoute = createRootRoute({
  component: () => (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <Toaster richColors position="top-right" />
      <TeamAutoLoader />
    </div>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Home,
});

const enterRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/enter",
  component: EntryForm,
});

const leaderboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/leaderboard",
  component: Leaderboard,
});

const entryDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/entry/$entryId",
  component: EntryDetail,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: Admin,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  enterRoute,
  leaderboardRoute,
  entryDetailRoute,
  adminRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
