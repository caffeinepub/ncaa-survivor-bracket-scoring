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
      .catch(() => {});
  }, [actor, isFetching]);

  return null;
}

const rootRoute = createRootRoute({
  component: () => (
    <div className="min-h-screen flex flex-col text-foreground relative">
      {/* Persistent bracket background across all pages */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src="/assets/generated/hero-banner.dim_1400x500.png"
          alt=""
          className="w-full h-full object-cover object-center"
        />
      </div>
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
        <Toaster richColors position="top-right" />
        <TeamAutoLoader />
      </div>
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
