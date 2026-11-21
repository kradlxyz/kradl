"use client";

import React, { useEffect, useState } from "react";

/**
 * Frameless, Hookr-inspired kinetic ASCII Matrix "K" emblem.
 * Zero boxy card chrome, zero external libraries, < 1% CPU (throttled ~7fps,
 * respects prefers-reduced-motion), subtle emerald & crisp white shimmer wave.
 */
const K_MASK = [
  "..................................",
  "...######..............#######....",
  "...######............########.....",
  "...######..........########.......",
  "...######........########.........",
  "...######......########...........",
  "...######....########.............",
  "...###############................",
  "...################...............",
  "...######....########.............",
  "...######......########...........",
  "...######........########.........",
  "...######..........########.......",
  "...######............########.....",
  "...######..............#######....",
  "..................................",
];

const ACTIVE_GLYPHS = ["K", "R", "A", "D", "L", "0", "1", "#", "+", "="];
const FIELD_GLYPHS = ["·", ".", ":", " "];

export function AsciiOrbitArt() {
  const [frame, setFrame] = useState(0);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(() => {
      setFrame((f) => (f + 1) % 64);
    }, 150);

    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      aria-hidden="true"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative select-none font-mono text-[11px] leading-[1.3] tracking-[0.14em] cursor-default"
    >
      {/* Subtle monochrome-emerald ambient depth behind the K mark */}
      <div
        className="pointer-events-none absolute -inset-6 rounded-full blur-2xl transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.14) 0%, rgba(250, 250, 250, 0.03) 45%, transparent 72%)",
          opacity: hovered ? 1 : 0.72,
        }}
      />

      <pre className="relative m-0">
        {K_MASK.map((row, r) => (
          <div key={r}>
            {row.split("").map((ch, c) => {
              const diag = r + c;
              const wave = (diag - frame) & 15;

              if (ch === "#") {
                const isEmeraldPulse = wave === 0 || wave === 1 || (hovered && wave === 2);
                const isBrightWhite = wave === 2 || wave === 3 || wave === 15;
                const glyphIdx = (r * 7 + c * 3 + Math.floor(frame / 2)) % ACTIVE_GLYPHS.length;
                const glyph = ACTIVE_GLYPHS[glyphIdx];

                return (
                  <span
                    key={c}
                    className={
                      isEmeraldPulse
                        ? "text-emerald-400 font-semibold"
                        : isBrightWhite
                          ? "text-white"
                          : "text-zinc-400"
                    }
                  >
                    {glyph}
                  </span>
                );
              }

              // Subtle architectural dot field
              const showDot = (r + c) % 2 === 0;
              if (!showDot) return <span key={c}> </span>;
              const fieldChar = FIELD_GLYPHS[(r + c + (wave === 0 ? 2 : 0)) % 3];
              return (
                <span key={c} className={wave === 0 ? "text-emerald-500/35" : "text-zinc-800"}>
                  {fieldChar}
                </span>
              );
            })}
          </div>
        ))}
      </pre>
    </div>
  );
}
