import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useActor } from "../hooks/useActor";
import { useFetchAndSyncScores } from "../hooks/useQueries";

interface ScoreSyncContextValue {
  lastSyncedAt: Date | null;
  triggerSync: () => void;
  isSyncing: boolean;
}

const ScoreSyncContext = createContext<ScoreSyncContextValue>({
  lastSyncedAt: null,
  triggerSync: () => {},
  isSyncing: false,
});

export function useScoreSync() {
  return useContext(ScoreSyncContext);
}

const TOURNAMENT_START = new Date("2026-03-20T00:00:00-06:00");
const INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
const INITIAL_DELAY_MS = 30 * 1000; // 30 seconds

export function ScoreSyncProvider({ children }: { children: React.ReactNode }) {
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const { actor, isFetching } = useActor();
  const syncMutation = useFetchAndSyncScores();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSyncingRef = useRef(false);

  const triggerSync = useCallback(() => {
    setLastSyncedAt(new Date());
  }, []);

  // Auto-sync silently
  const autoSync = useCallback(async () => {
    if (isSyncingRef.current) return;
    if (!actor || isFetching) return;
    if (new Date() < TOURNAMENT_START) return;

    isSyncingRef.current = true;
    try {
      await syncMutation.mutateAsync();
      setLastSyncedAt(new Date());
    } catch {
      // Silently fail for auto-sync
    } finally {
      isSyncingRef.current = false;
    }
  }, [actor, isFetching, syncMutation]);

  useEffect(() => {
    if (!actor || isFetching) return;
    if (new Date() < TOURNAMENT_START) return;

    // Initial delay before first auto-sync
    timeoutRef.current = setTimeout(() => {
      autoSync();
      intervalRef.current = setInterval(autoSync, INTERVAL_MS);
    }, INITIAL_DELAY_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [actor, isFetching, autoSync]);

  return (
    <ScoreSyncContext.Provider
      value={{
        lastSyncedAt,
        triggerSync,
        isSyncing: syncMutation.isPending,
      }}
    >
      {children}
    </ScoreSyncContext.Provider>
  );
}
