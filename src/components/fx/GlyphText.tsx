import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*/<>=+";

/** Título com efeito de decodificação de caracteres. */
export function GlyphText({
  text,
  className,
  speed = 28,
}: {
  text: string;
  className?: string;
  speed?: number;
}) {
  const [out, setOut] = useState(text);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let frame = 0;
    const total = text.length * 2 + 6;
    timer.current = setInterval(() => {
      frame += 1;
      const revealed = Math.floor((frame / total) * text.length);
      setOut(
        text
          .split("")
          .map((ch, i) => {
            if (i < revealed || ch === " ") return ch;
            return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          })
          .join(""),
      );
      if (frame >= total) {
        setOut(text);
        if (timer.current) clearInterval(timer.current);
      }
    }, speed);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [text, speed]);

  return <span className={cn("tabular-nums", className)}>{out}</span>;
}
