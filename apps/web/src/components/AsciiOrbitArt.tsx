"use client";

import React, { useEffect, useState } from "react";

/**
 * Pure, frameless kinetic ASCII Matrix "K" emblem.
 * Zero blur orbs, zero gradients, zero background dots — crisp monochrome typography only.
 */
const K_MASK = [
  "######              #######",
  "######            ######## ",
  "######          ########   ",
  "######        ########     ",
  "######      ########       ",
  "######    ########         ",
  "###############            ",
  "################           ",
  "######    ########         ",
  "######      ########       ",
  "######        ########     ",
  "######          ########   ",
  "######            ######## ",
  "######              #######",
];

const ACTIVE_GLYPHS = ["K", "R", "A", "D", "L", "0", "1", "#", "+", "="];

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
      className="select-none font-mono text-[11px] leading-[1.28] tracking-[0.14em] cursor-default"
    >
      <pre className="m-0">
        {K_MASK.map((row, r) => (
          <div key={r}>
            {row.split("").map((ch, c) => {
              if (ch !== "#") return <span key={c}> </span>;

              const diag = r + c;
              const wave = (diag - frame) & 15;
              const isEmeraldPulse = wave === 0 || (hovered && wave === 1);
              const isBrightWhite = wave === 1 || wave === 2 || wave === 15;
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
                        : "text-zinc-500"
                  }
                >
                  {glyph}
                </span>
              );
            })}
          </div>
        ))}
      </pre>
    </div>
  );
}
