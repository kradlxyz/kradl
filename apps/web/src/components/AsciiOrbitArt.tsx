"use client";

import React, { useEffect, useState } from "react";

/**
 * Lightweight, zero-dependency ASCII Reveal illustration of Kradl's Cradle Orbit Vessel.
 * Inspired by ascii-reveal: sweeps left-to-right on mount with monochrome glyph resolution,
 * then stays static at 0% CPU (respects prefers-reduced-motion).
 */
const ART_LINES = [
  "             ·  :  ·             ",
  "           ·   /\\    ·           ",
  "         ·    /  \\     ·         ",
  "        :    / ◆  \\     :        ",
  "       ·    /      \\     ·       ",
  "            \\      /             ",
  "             \\    /              ",
  "    ╭         \\  /         ╮     ",
  "    │  ╭       \\/       ╮  │     ",
  "    │  │                │  │     ",
  "    ╰   ╲              ╱   ╯     ",
  "      ╲   ╰──────────╯   ╱       ",
  "        ╰──────────────╯         ",
  "      [ KRADL · BLOCK ONE ]      ",
];

const SCRAMBLE_GLYPHS = ".:-=+*#%@";

export function AsciiOrbitArt() {
  const [revealCol, setRevealCol] = useState(0);
  const [tick, setTick] = useState(0);
  const [replayKey, setReplayKey] = useState(0);
  const maxCols = ART_LINES[0].length;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setRevealCol(maxCols + 4);
      return;
    }

    let col = 0;
    setRevealCol(0);
    const timer = window.setInterval(() => {
      col += 1;
      setRevealCol(col);
      setTick((t) => t + 1);
      if (col >= maxCols + 4) {
        window.clearInterval(timer);
      }
    }, 34);

    return () => window.clearInterval(timer);
  }, [maxCols, replayKey]);

  return (
    <div
      aria-hidden="true"
      onMouseEnter={() => {
        if (revealCol >= maxCols + 4) setReplayKey((k) => k + 1);
      }}
      className="select-none rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/80 px-5 py-4 font-mono text-[11px] leading-[1.35] tracking-[0.04em] cursor-default transition-colors hover:border-[var(--border-strong)]"
    >
      <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] pb-2.5 mb-2.5 border-b border-[var(--border-subtle)]">
        <span>ORBIT.SYS // 4663</span>
        <span className="inline-flex items-center gap-1.5 text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          MAINNET
        </span>
      </div>
      <pre className="m-0 overflow-hidden">
        {ART_LINES.map((line, r) => (
          <div key={r}>
            {line.split("").map((ch, c) => {
              if (ch === " ") return <span key={c}> </span>;

              // Highlight emerald core diamond
              if (ch === "◆") {
                return (
                  <span
                    key={c}
                    className={
                      c <= revealCol ? "text-emerald-400 font-bold" : "text-zinc-700"
                    }
                  >
                    {c <= revealCol ? ch : SCRAMBLE_GLYPHS[(r + c + tick) % SCRAMBLE_GLYPHS.length]}
                  </span>
                );
              }

              if (c <= revealCol - 2) {
                const isFooter = r === ART_LINES.length - 1;
                const isDim = ch === "·" || ch === ":";
                return (
                  <span
                    key={c}
                    className={
                      isFooter
                        ? "text-zinc-400"
                        : isDim
                          ? "text-zinc-600"
                          : "text-zinc-100"
                    }
                  >
                    {ch}
                  </span>
                );
              }

              if (c <= revealCol + 1) {
                const glyph = SCRAMBLE_GLYPHS[(r * 3 + c + tick) % SCRAMBLE_GLYPHS.length];
                return (
                  <span key={c} className="text-emerald-400/80">
                    {glyph}
                  </span>
                );
              }

              return (
                <span key={c} className="text-zinc-800">
                  ·
                </span>
              );
            })}
          </div>
        ))}
      </pre>
    </div>
  );
}
