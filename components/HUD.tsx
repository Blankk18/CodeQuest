'use client';
// components/HUD.tsx
// Cyberpunk HUD navbar — replicates all ID anchors from the original prototype
// so legacy CSS selectors keep working:
//   #h-hearts  #h-lvl  #h-xp  #h-streak  #h-fill  #h-lvl-badge
//
// Listens to the Zustand store; also handles XP float animations and
// badge/levelup toast rendering.

import { useEffect, useRef } from "react";
import { useGameStore } from "@/store/gameStore";
import { useSession, signOut } from "next-auth/react";

// ---------------------------------------------------------------------------
// HUD component
// ---------------------------------------------------------------------------
export function HUD() {
  const {
    hearts, level, xp, xpToNext, streakCount, toasts, dismissToast, userName, userImage,
  } = useGameStore();
  const { data: session } = useSession();
  const prevXp = useRef(xp);

  // XP fill percentage inside current level
  const fillPct = xpToNext > 0 ? Math.min((xp / xpToNext) * 100, 100) : 0;

  // Hearts string — filled ❤ for each heart, empty 🖤 for missing
  const heartsStr = "❤".repeat(hearts) + "🖤".repeat(Math.max(0, 5 - hearts));

  // Auto-dismiss XP toasts after 2 s
  useEffect(() => {
    for (const t of toasts) {
      if (t.type === "xp") {
        const timer = setTimeout(() => dismissToast(t.id), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [toasts, dismissToast]);

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Main HUD strip                                                       */}
      {/* ------------------------------------------------------------------ */}
      <nav className="hud-bar">
        {/* Left: logo */}
        <div className="hud-left">
          <span className="hud-logo">⚡ CODEQUEST</span>
        </div>

        {/* Right: stats */}
        <div className="hud-right">
          {/* Hearts — id matches original prototype */}
          <div className="hud-hearts" id="h-hearts" aria-label={`${hearts} of 5 hearts`}>
            {heartsStr}
          </div>

          {/* XP bar */}
          <div className="hud-xp">
            <div className="hud-xp-lbl">
              <span id="h-lvl">LVL {level}</span>
              <span id="h-xp">{xp}/{xpToNext}</span>
            </div>
            <div className="hud-xp-bar">
              <div
                className="hud-xp-fill"
                id="h-fill"
                style={{ width: `${fillPct}%` }}
                role="progressbar"
                aria-valuenow={fillPct}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>

          {/* Level badge */}
          <div className="hud-lvl" id="h-lvl-badge">⚡ LEVEL {level}</div>

          {/* Streak */}
          <div className="hud-streak" title="Daily streak">
            🔥<span id="h-streak">{streakCount}</span>
          </div>

          {/* Avatar / sign-out */}
          {session?.user && (
            <button
              className="hud-avatar"
              onClick={() => signOut()}
              title={`Signed in as ${session.user.name ?? session.user.email} — click to sign out`}
              aria-label="Sign out"
            >
              {userImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={userImage} alt={userName ?? "avatar"} width={28} height={28} />
              ) : (
                <span className="hud-avatar-initial">
                  {(userName ?? "U")[0].toUpperCase()}
                </span>
              )}
            </button>
          )}
        </div>
      </nav>

      {/* ------------------------------------------------------------------ */}
      {/* Toast area                                                           */}
      {/* ------------------------------------------------------------------ */}
      <div className="hud-toasts" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`hud-toast hud-toast--${t.type}`}
            onClick={() => dismissToast(t.id)}
          >
            {t.type === "xp" && (
              <span>+{t.payload.amount} XP</span>
            )}
            {t.type === "levelup" && (
              <>
                <span className="hud-toast-icon">⚡</span>
                <span>LEVEL UP! → {t.payload.level}</span>
              </>
            )}
            {t.type === "badge" && (
              <>
                <span className="hud-toast-icon">{t.payload.icon}</span>
                <span>Badge: {t.payload.name}</span>
              </>
            )}
          </div>
        ))}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* HUD-specific styles (scoped, keeps original CSS vars intact)         */}
      {/* ------------------------------------------------------------------ */}
      <style>{`
        .hud-bar {
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          background: var(--bg2, #0b0a1a);
          border-bottom: 1px solid var(--border, #2e2a6e);
          z-index: 1000;
          font-family: var(--font-game, 'Orbitron', sans-serif);
        }
        .hud-logo {
          font-size: 1rem;
          letter-spacing: 0.15em;
          background: var(--violetg, linear-gradient(135deg,#7b6ff7,#a78bfa));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 700;
        }
        .hud-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .hud-hearts { font-size: 1.1rem; letter-spacing: 2px; }
        .hud-xp { display: flex; flex-direction: column; gap: 2px; min-width: 120px; }
        .hud-xp-lbl {
          display: flex;
          justify-content: space-between;
          font-size: 0.6rem;
          color: var(--ink2, #a89fd8);
          font-family: var(--font-ui, 'Space Grotesk', sans-serif);
        }
        .hud-xp-bar {
          height: 5px;
          background: var(--bg4, #161438);
          border-radius: var(--rfull, 9999px);
          overflow: hidden;
        }
        .hud-xp-fill {
          height: 100%;
          background: var(--violetg, linear-gradient(135deg,#7b6ff7,#a78bfa));
          border-radius: var(--rfull, 9999px);
          transition: width 0.6s cubic-bezier(0.34,1.56,0.64,1);
        }
        .hud-lvl {
          font-size: 0.6rem;
          color: var(--gold, #f9c74f);
          letter-spacing: 0.1em;
        }
        .hud-streak { font-size: 0.85rem; }
        .hud-avatar {
          width: 28px; height: 28px;
          border-radius: 50%;
          border: 1px solid var(--border2, #3d3890);
          overflow: hidden;
          background: var(--panel, #1a183a);
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          padding: 0;
        }
        .hud-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .hud-avatar-initial { font-size: 0.75rem; color: var(--ink, #f0eeff); }

        /* Toasts */
        .hud-toasts {
          position: fixed;
          top: 64px; right: 16px;
          display: flex; flex-direction: column; gap: 8px;
          z-index: 1100;
          pointer-events: none;
        }
        .hud-toast {
          padding: 10px 18px;
          border-radius: var(--r8, 8px);
          font-family: var(--font-game, 'Orbitron', sans-serif);
          font-size: 0.75rem;
          letter-spacing: 0.1em;
          display: flex; align-items: center; gap: 8px;
          animation: toastIn 0.3s ease forwards;
          pointer-events: auto;
          cursor: pointer;
        }
        .hud-toast--xp     { background: var(--panel2, #221f4a); color: var(--mint, #43e97b); border: 1px solid var(--mint, #43e97b); }
        .hud-toast--levelup{ background: var(--panel2, #221f4a); color: var(--gold, #f9c74f);  border: 1px solid var(--gold, #f9c74f);  }
        .hud-toast--badge  { background: var(--panel2, #221f4a); color: var(--violet2, #a78bfa); border: 1px solid var(--violet, #7b6ff7); }
        .hud-toast-icon    { font-size: 1rem; }

        @keyframes toastIn {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        /* Spacer so page content starts below fixed HUD */
        body { padding-top: 56px; }
      `}</style>
    </>
  );
}
