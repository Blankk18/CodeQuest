// app/providers.tsx
// Client providers: SessionProvider (NextAuth) + Zustand store hydration.
// Runs as a Client Component so the rest of the app can use server components.
'use client';

import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";
import { useGameStore } from "@/store/gameStore";

function StoreHydrator() {
  const syncFromServer = useGameStore((s) => s.syncFromServer);
  const setStreak      = useGameStore((s) => s.setStreak);

  useEffect(() => {
    // 1. Fetch full profile and sync store
    fetch("/api/profile")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) syncFromServer(data);
      })
      .catch(() => { /* offline — use persisted store */ });

    // 2. Update streak on login
    fetch("/api/streak/check", { method: "POST" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.streakCount != null) setStreak(data.streakCount);
      })
      .catch(() => {});
  }, []); // run once on mount

  return null;
}

export function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: any;
}) {
  return (
    <SessionProvider session={session}>
      <StoreHydrator />
      {children}
    </SessionProvider>
  );
}
