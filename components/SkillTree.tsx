'use client';
// components/SkillTree.tsx
// Renders the 9-node skill tree grid from the Zustand store.
// Locked nodes display a padlock; completed nodes glow.

import { useGameStore } from "@/store/gameStore";

const DIFFICULTIES: Record<string, string> = {
  "syntax-dungeon": "EASY",
  "exec-arena":     "MEDIUM",
  "sort-arena":     "MEDIUM",
  "hanoi":          "HARD",
  "bst":            "HARD",
  "stack-boss":     "BOSS",
};

export function SkillTree({ onQuestOpen }: { onQuestOpen?: (questId: string) => void }) {
  const skillNodes = useGameStore((s) => s.skillNodes);
  const cleared    = useGameStore((s) => s.cleared);

  return (
    <section className="skill-tree" aria-label="Skill tree">
      <h2 className="skill-tree__title">SKILL TREE</h2>
      <div className="skill-tree__grid">
        {skillNodes.map((node) => {
          const isCleared = node.questId ? cleared[node.questId] : false;
          const isLocked  = node.status === "locked";
          const isActive  = node.status === "active";

          return (
            <button
              key={node.id}
              className={[
                "skill-node",
                isCleared  ? "skill-node--cleared" : "",
                isLocked   ? "skill-node--locked"  : "",
                isActive   ? "skill-node--active"  : "",
              ].join(" ").trim()}
              disabled={isLocked}
              onClick={() => node.questId && onQuestOpen?.(node.questId)}
              aria-label={`${node.name}${isLocked ? " (locked)" : isCleared ? " (cleared)" : ""}`}
            >
              <span className="skill-node__icon" aria-hidden="true">
                {isLocked ? "🔒" : node.icon}
              </span>
              <span className="skill-node__name">{node.name}</span>
              {node.questId && (
                <span className="skill-node__difficulty">
                  {DIFFICULTIES[node.questId] ?? ""}
                </span>
              )}
              {isCleared && <span className="skill-node__check" aria-hidden="true">✓</span>}
            </button>
          );
        })}
      </div>

      <style>{`
        .skill-tree { margin: 40px 0; }
        .skill-tree__title {
          font-family: var(--font-game,'Orbitron',sans-serif);
          font-size: 0.75rem;
          letter-spacing: 0.2em;
          color: var(--ink2,#a89fd8);
          margin-bottom: 16px;
          text-transform: uppercase;
        }
        .skill-tree__grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 12px;
        }
        .skill-node {
          position: relative;
          background: var(--panel,#1a183a);
          border: 1px solid var(--border,#2e2a6e);
          border-radius: var(--r12,12px);
          padding: 16px 12px;
          text-align: center;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          display: flex; flex-direction: column; align-items: center; gap: 6px;
        }
        .skill-node:not(:disabled):hover {
          transform: translateY(-3px);
          box-shadow: var(--glow-violet, 0 0 20px rgba(123,111,247,.5));
        }
        .skill-node--locked {
          opacity: 0.45;
          cursor: not-allowed;
        }
        .skill-node--active {
          border-color: var(--violet,#7b6ff7);
          box-shadow: 0 0 12px rgba(123,111,247,.3);
        }
        .skill-node--cleared {
          border-color: var(--mint,#43e97b);
          box-shadow: 0 0 12px rgba(67,233,123,.3);
        }
        .skill-node__icon   { font-size: 1.8rem; }
        .skill-node__name   {
          font-family: var(--font-ui,'Space Grotesk',sans-serif);
          font-size: 0.7rem; font-weight: 600;
          color: var(--ink,#f0eeff);
        }
        .skill-node__difficulty {
          font-family: var(--font-game,'Orbitron',sans-serif);
          font-size: 0.5rem; letter-spacing: 0.15em;
          color: var(--ink3,#6a639e);
        }
        .skill-node__check {
          position: absolute; top: 6px; right: 8px;
          font-size: 0.75rem;
          color: var(--mint,#43e97b);
        }
      `}</style>
    </section>
  );
}
