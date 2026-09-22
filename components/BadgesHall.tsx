'use client';
// components/BadgesHall.tsx
// Renders the hall of badges. Earned badges are lit; unearned are silhouetted.

import { useGameStore } from "@/store/gameStore";

// Full badge catalogue (mirroring DB seed order)
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

export function BadgesHall() {
  const earned = useGameStore((s) => s.badges);
  const earnedIds = new Set(earned.map((b) => b.id));

  return (
    <section className="badges-hall" aria-label="Badges hall">
      <h2 className="badges-hall__title">BADGES</h2>
      <div className="badges-hall__grid">
        {ALL_BADGES.map((badge) => {
          const isEarned = earnedIds.has(badge.id);
          return (
            <div
              key={badge.id}
              className={`badge-card ${isEarned ? "badge-card--earned" : "badge-card--locked"}`}
              title={badge.description}
              aria-label={`${badge.name}${isEarned ? " (earned)" : " (not yet earned)"}`}
            >
              <span className="badge-card__icon" aria-hidden="true">
                {isEarned ? badge.icon : "❓"}
              </span>
              <span className="badge-card__name">
                {isEarned ? badge.name : "???"}
              </span>
              {isEarned && (
                <span className="badge-card__desc">{badge.description}</span>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        .badges-hall { margin: 40px 0; }
        .badges-hall__title {
          font-family: var(--font-game,'Orbitron',sans-serif);
          font-size: 0.75rem; letter-spacing: 0.2em;
          color: var(--ink2,#a89fd8); margin-bottom: 16px;
        }
        .badges-hall__grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
          gap: 12px;
        }
        .badge-card {
          background: var(--panel,#1a183a);
          border: 1px solid var(--border,#2e2a6e);
          border-radius: var(--r12,12px);
          padding: 16px 10px;
          text-align: center;
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .badge-card--earned {
          border-color: var(--gold,#f9c74f);
          box-shadow: 0 0 12px rgba(249,199,79,.25);
        }
        .badge-card--earned:hover {
          transform: translateY(-3px);
          box-shadow: var(--glow-gold,0 0 20px rgba(249,199,79,.5));
        }
        .badge-card--locked { opacity: 0.35; }
        .badge-card__icon { font-size: 2rem; }
        .badge-card__name {
          font-family: var(--font-game,'Orbitron',sans-serif);
          font-size: 0.55rem; letter-spacing: 0.1em;
          color: var(--ink,#f0eeff); font-weight: 700;
        }
        .badge-card__desc {
          font-family: var(--font-ui,'Space Grotesk',sans-serif);
          font-size: 0.6rem; color: var(--ink2,#a89fd8);
          text-align: center;
        }
      `}</style>
    </section>
  );
}
