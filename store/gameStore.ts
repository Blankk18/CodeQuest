// store/gameStore.ts
// Zustand store — single source of truth for all HUD state.
// The `persist` middleware backs it to localStorage so the UI survives a refresh
// while the user is offline; a sync call overwrites it with server truth on mount.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface SkillNodeState {
  id: string;
  icon: string;
  name: string;
  questId: string | null;
  status: "unlocked" | "active" | "locked";
}

export interface BadgeState {
  id: string;
  icon: string;
  name: string;
  description: string;
}

export interface QuestCleared {
  [questId: string]: boolean;
}

export interface GameState {
  // HUD
  xp:          number;
  totalXp:     number;
  level:       number;
  xpToNext:    number;
  hearts:      number;
  streakCount: number;

  // Progress
  badges:     BadgeState[];
  skillNodes: SkillNodeState[];
  cleared:    QuestCleared;

  // Auth
  userId:     string | null;
  userName:   string | null;
  userImage:  string | null;

  // Toast queue (for level-up / badge toasts)
  toasts: { id: string; type: "badge" | "levelup" | "xp"; payload: any }[];
}

export interface GameActions {
  // Called after /api/profile returns
  syncFromServer: (profile: {
    user: { id: string; name: string | null; image: string | null; totalXp: number; level: number; hearts: number; streakCount: number };
    earnedBadges: BadgeState[];
    skillNodes: SkillNodeState[];
    clearedQuestIds: string[];
  }) => void;

  // Called after /api/quests/submit returns
  applyQuestResult: (result: {
    xpEarned: number;
    newTotalXp: number;
    newLevel: number;
    leveledUp: boolean;
    xpToNext: number;
    newBadges: string[];
    updatedSkills: string[];
  }, allBadges: BadgeState[]) => void;

  // Local heart updates (optimistic; server is source of truth)
  loseHeart:   () => void;
  setHearts:   (n: number) => void;

  // Streak
  setStreak:   (n: number) => void;

  // Toasts
  pushToast:   (t: GameState["toasts"][number]) => void;
  dismissToast:(id: string) => void;

  // Reset (sign-out)
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Level helpers (must match server formula in /api/quests/submit)
// ---------------------------------------------------------------------------
function calcLevel(totalXp: number): number {
  return Math.floor(Math.pow(totalXp / 100, 1 / 1.5)) + 1;
}

function calcXpToNext(level: number): number {
  return Math.round(100 * Math.pow(level, 1.5));
}

function calcXpInLevel(totalXp: number, level: number): number {
  const prevLevelXp = level > 1 ? Math.round(100 * Math.pow(level - 1, 1.5)) : 0;
  return totalXp - prevLevelXp;
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------
const INITIAL: GameState = {
  xp:          0,
  totalXp:     0,
  level:       1,
  xpToNext:    100,
  hearts:      5,
  streakCount: 0,
  badges:      [],
  skillNodes:  [],
  cleared:     {},
  userId:      null,
  userName:    null,
  userImage:   null,
  toasts:      [],
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------
export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => ({
      ...INITIAL,

      syncFromServer({ user, earnedBadges, skillNodes, clearedQuestIds }) {
        const level   = calcLevel(user.totalXp);
        const xpToNext = calcXpToNext(level);
        const xp      = calcXpInLevel(user.totalXp, level);
        const cleared: QuestCleared = {};
        for (const id of clearedQuestIds) cleared[id] = true;

        set({
          userId:      user.id,
          userName:    user.name,
          userImage:   user.image,
          totalXp:     user.totalXp,
          level,
          xpToNext,
          xp,
          hearts:      user.hearts,
          streakCount: user.streakCount,
          badges:      earnedBadges,
          skillNodes,
          cleared,
        });
      },

      applyQuestResult(result, allBadges) {
        const { newTotalXp, newLevel, leveledUp, xpToNext: xtn, newBadges, updatedSkills } = result;
        const xp = calcXpInLevel(newTotalXp, newLevel);

        const newToasts = [...get().toasts];

        // XP float toast
        newToasts.push({ id: `xp-${Date.now()}`, type: "xp", payload: { amount: result.xpEarned } });

        // Level-up toast
        if (leveledUp) {
          newToasts.push({ id: `lvl-${Date.now()}`, type: "levelup", payload: { level: newLevel } });
        }

        // Badge toasts
        for (const badgeId of newBadges) {
          const badge = allBadges.find((b) => b.id === badgeId);
          if (badge)
            newToasts.push({ id: `badge-${badgeId}`, type: "badge", payload: badge });
        }

        // Merge new badges into earned set
        const updatedBadgeIds = new Set(get().badges.map((b) => b.id));
        const mergedBadges = [...get().badges];
        for (const badgeId of newBadges) {
          if (!updatedBadgeIds.has(badgeId)) {
            const b = allBadges.find((b) => b.id === badgeId);
            if (b) mergedBadges.push(b);
          }
        }

        // Unlock skill nodes
        const updatedNodes = get().skillNodes.map((n) =>
          updatedSkills.includes(n.id) ? { ...n, status: "unlocked" as const } : n
        );

        set((s) => ({
          totalXp:    newTotalXp,
          level:      newLevel,
          xpToNext:   xtn,
          xp,
          badges:     mergedBadges,
          skillNodes: updatedNodes,
          cleared:    { ...s.cleared, [result as any]: true },
          toasts:     newToasts,
        }));
      },

      loseHeart() {
        set((s) => ({ hearts: Math.max(0, s.hearts - 1) }));
      },

      setHearts(n) {
        set({ hearts: n });
      },

      setStreak(n) {
        set({ streakCount: n });
      },

      pushToast(t) {
        set((s) => ({ toasts: [...s.toasts, t] }));
      },

      dismissToast(id) {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      },

      reset() {
        set(INITIAL);
      },
    }),
    {
      name:    "codequest-game-store",
      storage: createJSONStorage(() => localStorage),
      // Only persist lightweight HUD data; server re-hydrates on mount
      partialize: (s) => ({
        totalXp:     s.totalXp,
        level:       s.level,
        xpToNext:    s.xpToNext,
        xp:          s.xp,
        hearts:      s.hearts,
        streakCount: s.streakCount,
        cleared:     s.cleared,
        userId:      s.userId,
        userName:    s.userName,
      }),
    }
  )
);
