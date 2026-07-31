import { useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Painel holográfico: vidro fosco + borda de energia + tilt 3D
 * seguindo o cursor com holofote (spotlight).
 */
export function TiltCard({
  children,
  className,
  intensity = 7,
  spotlight = true,
  sweep = false,
  style,
}: {
  children: ReactNode;
  className?: string;
  intensity?: number;
  spotlight?: boolean;
  sweep?: boolean;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
    el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * intensity}deg) rotateY(${(px - 0.5) * intensity}deg) translateZ(0)`;
    const spot = el.querySelector<HTMLElement>("[data-holo-spot]");
    if (spot) spot.style.opacity = "1";
  }

  function handleLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
    const spot = el.querySelector<HTMLElement>("[data-holo-spot]");
    if (spot) spot.style.opacity = "0";
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ transformStyle: "preserve-3d", transition: "transform 0.3s ease", ...style }}
      className={cn("holo group relative", className)}
    >
      {spotlight ? <span data-holo-spot className="holo-spot" /> : null}
      {sweep ? <span className="hud-sweep" /> : null}
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
