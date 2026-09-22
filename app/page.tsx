'use client';
// app/page.tsx
// Home page: Hero section → Quest Lobby (6 quest cards) → Skill Tree → Badges Hall

import { useSession, signIn } from "next-auth/react";
import { SkillTree } from "@/components/SkillTree";
import { BadgesHall } from "@/components/BadgesHall";
import { InstallButton } from "@/components/InstallButton";
import { useGameStore } from "@/store/gameStore";
import { QUEST_CONFIG } from "@/lib/questConfig";

export default function HomePage() {
  const { data: session, status } = useSession();
  const cleared = useGameStore((s) => s.cleared);

  // When a skill node / quest card is clicked, open the corresponding modal.
  // In the integrated build the modal is rendered by the game iframe or modal
  // component; here we scroll to the corresponding section.
  function openQuest(questId: string) {
    document.getElementById(`quest-${questId}`)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="container" style={{ paddingTop: 32 }}>

      {/* ── Hero ── */}
      <section className="hero" style={{ textAlign: "center", padding: "48px 0 40px" }}>
        <h1 className="hero__title">
          CODE<span style={{ color: "var(--violet)" }}>QUEST</span>
        </h1>
        <p className="hero__subtitle">
          Master Data Structures &amp; Algorithms through cyberpunk adventure
        </p>

        {status === "unauthenticated" && (
          <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn btn--primary" onClick={() => signIn("github")}>
              🐙 Sign in with GitHub
            </button>
            <button className="btn btn--secondary" onClick={() => signIn()}>
              ✉️ Sign in with Email
            </button>
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <InstallButton />
        </div>
      </section>

      {/* ── Quest Lobby ── */}
      <section className="quest-lobby" aria-label="Quest lobby">
        <h2 className="section-title">QUESTS</h2>
        <div className="quest-grid">
          {QUEST_CONFIG.map((q) => (
            <div
              key={q.id}
              id={`quest-${q.id}`}
              className={`quest-card quest-card--${q.difficulty.toLowerCase()} ${cleared[q.id] ? "quest-card--cleared" : ""}`}
            >
              <div className="quest-card__header">
                <span className="quest-card__icon" aria-hidden="true">{q.icon}</span>
                <span className={`quest-badge quest-badge--${q.difficulty.toLowerCase()}`}>
                  {q.difficulty}
                </span>
              </div>
              <h3 className="quest-card__name">{q.name}</h3>
              <p className="quest-card__desc">{q.description}</p>
              <div className="quest-card__footer">
                <span className="quest-card__xp">+{q.baseXp} XP</span>
                {cleared[q.id] && <span className="quest-card__done">✓ CLEARED</span>}
              </div>
              {status === "authenticated" && !cleared[q.id] && (
                <button
                  className="btn btn--primary quest-card__cta"
                  onClick={() => openQuest(q.id)}
                  aria-label={`Start ${q.name}`}
                >
                  ENTER QUEST
                </button>
              )}
              {status === "unauthenticated" && (
                <button className="btn btn--secondary quest-card__cta" onClick={() => signIn()}>
                  SIGN IN TO PLAY
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Skill Tree ── */}
      <SkillTree onQuestOpen={openQuest} />

      {/* ── Badges Hall ── */}
      <BadgesHall />

      {/* ── Inline page styles ── */}
      <style>{`
        .hero__title {
          font-family: var(--font-game,'Orbitron',sans-serif);
          font-size: clamp(2rem, 6vw, 4rem);
          letter-spacing: 0.15em;
          font-weight: 900;
          color: var(--ink);
        }
        .hero__subtitle {
          margin-top: 12px;
          color: var(--ink2);
          font-size: clamp(0.85rem, 2vw, 1rem);
        }
        .section-title {
          font-family: var(--font-game,'Orbitron',sans-serif);
          font-size: 0.75rem; letter-spacing: 0.2em;
          color: var(--ink2); margin-bottom: 16px;
        }
        .quest-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 16px;
          margin-bottom: 40px;
        }
        .quest-card {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: var(--r16);
          padding: 20px;
          display: flex; flex-direction: column; gap: 10px;
          position: relative; overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .quest-card:hover { transform: translateY(-4px); }
        .quest-card--cleared { border-color: var(--mint); }
        .quest-card--easy:hover    { box-shadow: var(--glow-mint); }
        .quest-card--medium:hover  { box-shadow: var(--glow-violet); }
        .quest-card--hard:hover    { box-shadow: var(--glow-cyan); }
        .quest-card--boss:hover    { box-shadow: var(--glow-gold); }

        .quest-card__header { display: flex; align-items: center; justify-content: space-between; }
        .quest-card__icon   { font-size: 2rem; }
        .quest-badge {
          font-family: var(--font-game,'Orbitron',sans-serif);
          font-size: 0.5rem; letter-spacing: 0.1em; font-weight: 700;
          padding: 3px 8px; border-radius: var(--rfull);
        }
        .quest-badge--easy   { background: rgba(67,233,123,.15); color: var(--mint); border: 1px solid var(--mint); }
        .quest-badge--medium { background: rgba(123,111,247,.15); color: var(--violet2); border: 1px solid var(--violet); }
        .quest-badge--hard   { background: rgba(0,212,255,.15);   color: var(--cyan);    border: 1px solid var(--cyan); }
        .quest-badge--boss   { background: rgba(249,199,79,.15);  color: var(--gold);    border: 1px solid var(--gold); }

        .quest-card__name {
          font-family: var(--font-game,'Orbitron',sans-serif);
          font-size: 0.9rem; letter-spacing: 0.1em;
          color: var(--ink);
        }
        .quest-card__desc  { font-size: 0.8rem; color: var(--ink2); line-height: 1.5; }
        .quest-card__footer { display: flex; align-items: center; justify-content: space-between; }
        .quest-card__xp    { font-size: 0.7rem; color: var(--gold); font-family: var(--font-game,'Orbitron',sans-serif); }
        .quest-card__done  { font-size: 0.6rem; color: var(--mint); font-family: var(--font-game,'Orbitron',sans-serif); letter-spacing: 0.1em; }
        .quest-card__cta   { margin-top: 4px; width: 100%; justify-content: center; }

        /* Shared buttons */
        .btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 20px; border: none; border-radius: var(--rfull);
          font-family: var(--font-game,'Orbitron',sans-serif);
          font-size: 0.65rem; letter-spacing: 0.12em; font-weight: 700;
          cursor: pointer; transition: opacity 0.2s, transform 0.2s;
        }
        .btn--primary   { background: var(--violetg); color: #fff; }
        .btn--secondary { background: transparent; color: var(--ink); border: 1px solid var(--border2); }
        .btn:hover      { opacity: 0.85; transform: translateY(-1px); }
      `}</style>
    </div>
  );
}
