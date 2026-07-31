/**
 * Fundo animado em camadas: grid de perspectiva, anéis orbitais,
 * auroras, scanlines e feixes de dados. Puramente visual.
 */
const BEAMS = [
  { left: "8%", delay: "0s", duration: "7s" },
  { left: "23%", delay: "1.8s", duration: "9s" },
  { left: "41%", delay: "3.4s", duration: "6.5s" },
  { left: "58%", delay: "0.9s", duration: "8.5s" },
  { left: "74%", delay: "2.6s", duration: "7.5s" },
  { left: "91%", delay: "4.2s", duration: "10s" },
];

export function HudBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* base tint */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% -10%, var(--hud-bg-tint), transparent 70%), radial-gradient(80% 60% at 50% 110%, var(--hud-bg-tint), transparent 70%)",
        }}
      />

      {/* auroras / blobs de luz */}
      <div
        className="hud-aurora-blob"
        style={{
          top: "-12%",
          left: "-8%",
          height: "46vh",
          width: "46vh",
          background: "var(--neon)",
          opacity: 0.28,
        }}
      />
      <div
        className="hud-aurora-blob"
        style={{
          top: "18%",
          right: "-10%",
          height: "52vh",
          width: "52vh",
          background: "var(--neon-2)",
          opacity: 0.26,
          animationDelay: "-6s",
        }}
      />
      <div
        className="hud-aurora-blob"
        style={{
          bottom: "-18%",
          left: "35%",
          height: "40vh",
          width: "40vh",
          background: "var(--primary)",
          opacity: 0.22,
          animationDelay: "-11s",
        }}
      />

      {/* anéis orbitais */}
      <div className="hud-ring left-1/2 top-[12%] h-[64vh] w-[64vh] -translate-x-1/2 opacity-40" />
      <div className="hud-ring hud-ring-rev left-1/2 top-[4%] h-[92vh] w-[92vh] -translate-x-1/2 opacity-25" />

      {/* feixes de dados */}
      {BEAMS.map((b) => (
        <span
          key={b.left}
          className="hud-beam"
          style={{ left: b.left, animationDelay: b.delay, animationDuration: b.duration }}
        />
      ))}

      {/* grid de perspectiva correndo para o horizonte */}
      <div className="hud-grid-plane" />

      {/* scanlines */}
      <div className="hud-scanlines" />
    </div>
  );
}
