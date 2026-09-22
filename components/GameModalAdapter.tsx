'use client';
// components/GameModalAdapter.tsx
// Wraps each game modal with:
//   1. Auth gate  — redirects unauthenticated users to /auth/signin
//   2. Heart gate — blocks entry when hearts === 0
//   3. Quest submit hook — calls /api/quests/submit on completion
//   4. Mistake hook — calls /api/hearts/lose and updates Zustand store
//
// Usage:
//   <GameModalAdapter questId="syntax-dungeon" minTimeSecs={10}>
//     <SyntaxDungeonGame />
//   </GameModalAdapter>
//
// Children receive the context via useGameModal():
//   const { onComplete, onMistake, isBlocked } = useGameModal();

import React, { createContext, useContext, useCallback, useRef, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useGameStore } from "@/store/gameStore";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
interface GameModalContextValue {
  /** Call this when the player finishes the quest successfully */
  onComplete:  (opts?: { isOptimal?: boolean }) => Promise<void>;
  /** Call this when the player makes a mistake (loses a heart) */
  onMistake:   () => Promise<void>;
  /** True when hearts === 0 — render a "No hearts" overlay in the game */
  isBlocked:   boolean;
  /** True while the submit request is in-flight */
  isSubmitting: boolean;
}

const GameModalContext = createContext<GameModalContextValue | null>(null);

export function useGameModal(): GameModalContextValue {
  const ctx = useContext(GameModalContext);
  if (!ctx) throw new Error("useGameModal must be used inside <GameModalAdapter>");
  return ctx;
}

// ---------------------------------------------------------------------------
// Static badge catalogue (matches DB seeds — used for toast enrichment)
// ---------------------------------------------------------------------------
const ALL_BADGES = [
  { id: "first-login",     icon: "🌟", name: "FIRST LOGIN",     description: "Opened CodeQuest" },
  { id: "bug-squasher",    icon: "🐛", name: "BUG SQUASHER",    description: "Completed a syntax puzzle" },
  { id: "time-traveler",   icon: "⏪", name: "TIME TRAVELER",   description: "Stepped backward in execution" },
  { id: "debugger",        icon: "🧭", name: "DEBUGGER",        description: "Ran a program to completion" },
  { id: "sort-master",     icon: "🫧", name: "SORT MASTER",     description: "Finished bubble sort visualizer" },
  { id: "tower-conqueror", icon: "🏰", name: "TOWER CONQUEROR", description: "Solved Tower of Hanoi" },
  { id: "tree-whisperer",  icon: "🌳", name: "TREE WHISPERER",  description: "Built a BST with 5+ nodes" },
  { id: "stack-overflow",  icon: "📚", name: "STACK OVERFLOW",  description: "Pushed 5 items on the stack" },
  { id: "queue-master",    icon: "🚶", name: "QUEUE MASTER",    description: "Dequeued 5 items from a queue" },
  { id: "on-a-roll",       icon: "🔥", name: "ON A ROLL",       description: "Earned XP three times" },
  { id: "perfect-hanoi",   icon: "💎", name: "OPTIMAL MOVER",   description: "Solved Hanoi in minimum moves" },
  { id: "completionist",   icon: "🏆", name: "COMPLETIONIST",   description: "Cleared all six games" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface GameModalAdapterProps {
  questId:     string;
  minTimeSecs: number;        // anti-cheat minimum — component enforces locally too
  children:    React.ReactNode;
}

export function GameModalAdapter({ questId, minTimeSecs, children }: GameModalAdapterProps) {
  const { data: session, status } = useSession();
  const loseHeart       = useGameStore((s) => s.loseHeart);
  const hearts          = useGameStore((s) => s.hearts);
  const applyQuestResult = useGameStore((s) => s.applyQuestResult);

  const startTimeRef    = useRef<number>(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auth gate: redirect if unauthenticated
  const assertAuth = useCallback(() => {
    if (status === "unauthenticated") {
      signIn(undefined, { callbackUrl: window.location.href });
      return false;
    }
    return status === "authenticated";
  }, [status]);

  // -------------------------------------------------------------------
  // onComplete
  // -------------------------------------------------------------------
  const onComplete = useCallback(async (opts: { isOptimal?: boolean } = {}) => {
    if (!assertAuth()) return;

    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    if (elapsed < minTimeSecs) {
      // Client-side anti-cheat guard (server also validates)
      console.warn(`Quest completed too fast (${elapsed}s < ${minTimeSecs}s)`);
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/quests/submit", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          questId,
          timeSpentSeconds: Math.max(elapsed, minTimeSecs),
          isOptimal: opts.isOptimal ?? false,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("Quest submit error:", err);
        return;
      }

      const data = await res.json();
      applyQuestResult(data, ALL_BADGES);
    } finally {
      setIsSubmitting(false);
      startTimeRef.current = Date.now(); // reset timer for replays
    }
  }, [assertAuth, applyQuestResult, minTimeSecs, questId]);

  // -------------------------------------------------------------------
  // onMistake
  // -------------------------------------------------------------------
  const onMistake = useCallback(async () => {
    if (!assertAuth()) return;

    // Optimistic update
    loseHeart();

    try {
      const res = await fetch("/api/hearts/lose", { method: "POST" });
      if (res.ok) {
        const { hearts: serverHearts } = await res.json();
        // Re-sync if server disagrees (e.g. regen happened between calls)
        useGameStore.getState().setHearts(serverHearts);
      }
    } catch {
      // Keep the optimistic deduction; will sync on next profile load
    }
  }, [assertAuth, loseHeart]);

  // -------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------
  const isBlocked = hearts <= 0;

  return (
    <GameModalContext.Provider value={{ onComplete, onMistake, isBlocked, isSubmitting }}>
      {isBlocked && (
        <div className="hearts-blocked-overlay">
          <div className="hearts-blocked-inner">
            <span className="hearts-blocked-icon">💔</span>
            <h2 className="hearts-blocked-title">OUT OF HEARTS</h2>
            <p className="hearts-blocked-body">
              Hearts regenerate at +1 every 30 minutes.<br />
              Come back later or keep reading!
            </p>
          </div>
        </div>
      )}
      {children}
    </GameModalContext.Provider>
  );
}
