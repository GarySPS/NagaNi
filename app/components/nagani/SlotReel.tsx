//app/components>nagani>SlotReel.tsx

"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

export type ReelSymbolKey =
  | "dragon"
  | "tiger"
  | "koi"
  | "ruby"
  | "gold"
  | "chinthe"
  | "lotus"
  | "coin"
  | "pattern";

type SlotReelProps = {
  reelIndex: number;
  finalSymbol: ReelSymbolKey | string;
  isSpinning: boolean;
  isNearMiss?: boolean;
  spinKey: number;
  onStop?: (reelIndex: number) => void;
};

const ITEM_HEIGHT = 112;

const SYMBOLS: Record<
  ReelSymbolKey,
  {
    label: string;
    glyph: string;
    accent: string;
  }
> = {
  dragon: {
    label: "Dragon",
    glyph: "🐉",
    accent: "text-[#FFD700]",
  },
  tiger: {
  label: "Tiger",
  glyph: "🐅",
  accent: "text-orange-300",
},
koi: {
  label: "Koi",
  glyph: "🐟",
  accent: "text-cyan-200",
},
  ruby: {
    label: "Ruby",
    glyph: "♦",
    accent: "text-red-400",
  },
  gold: {
    label: "Gold",
    glyph: "●",
    accent: "text-[#FFD700]",
  },
  chinthe: {
    label: "Chinthe",
    glyph: "🦁",
    accent: "text-amber-200",
  },
  lotus: {
    label: "Lotus",
    glyph: "✦",
    accent: "text-pink-200",
  },
  coin: {
    label: "Coin",
    glyph: "◎",
    accent: "text-yellow-200",
  },
  pattern: {
    label: "Pattern",
    glyph: "◆",
    accent: "text-white/70",
  },
};

const SYMBOL_KEYS = Object.keys(SYMBOLS) as ReelSymbolKey[];

function normalizeSymbol(symbol: string | undefined | null): ReelSymbolKey {
  const key = String(symbol || "").toLowerCase() as ReelSymbolKey;
  return SYMBOLS[key] ? key : "pattern";
}

function randomSymbol(): ReelSymbolKey {
  return SYMBOL_KEYS[Math.floor(Math.random() * SYMBOL_KEYS.length)];
}

function buildReelTrack(finalSymbol: ReelSymbolKey, reelIndex: number, isNearMiss?: boolean) {
  const extraNearMissWeight = isNearMiss && reelIndex === 2 ? 18 : 0;
  const length = 26 + reelIndex * 6 + extraNearMissWeight;

  return Array.from({ length }, () => randomSymbol()).concat(finalSymbol);
}

export default function SlotReel({
  reelIndex,
  finalSymbol,
  isSpinning,
  isNearMiss = false,
  spinKey,
  onStop,
}: SlotReelProps) {
  const safeFinalSymbol = normalizeSymbol(finalSymbol);

const [track, setTrack] = useState<ReelSymbolKey[]>([safeFinalSymbol]);
const [hasSettled, setHasSettled] = useState(true);

  const isDramaReel = isNearMiss && reelIndex === 2;

  const spinDuration = useMemo(() => {
    const baseDuration = 1.45 + reelIndex * 0.28;
    return isDramaReel ? baseDuration + 2 : baseDuration;
  }, [isDramaReel, reelIndex]);

  useEffect(() => {
    if (!isSpinning) return;

    setHasSettled(false);
    setTrack(buildReelTrack(safeFinalSymbol, reelIndex, isNearMiss));
}, [spinKey, isSpinning, safeFinalSymbol, reelIndex, isNearMiss]);

  const targetY = -(track.length - 1) * ITEM_HEIGHT;

  return (
    <motion.div
      className="relative h-36 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.055] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_22px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl"
      animate={
        hasSettled
          ? {
              y: [0, 7, -3, 0],
              scale: [1, 1.018, 0.994, 1],
            }
          : {
              y: 0,
              scale: 1,
            }
      }
transition={{
  duration: 0.42,
  ease: [0.18, 0.9, 0.25, 1],
}}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-12 bg-gradient-to-b from-[#050505] via-[#050505]/75 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-12 bg-gradient-to-t from-[#050505] via-[#050505]/75 to-transparent" />

      <div className="pointer-events-none absolute left-0 top-5 z-20 h-[calc(100%-2.5rem)] w-px bg-gradient-to-b from-transparent via-[#FFD700]/55 to-transparent" />
      <div className="pointer-events-none absolute right-0 top-5 z-20 h-[calc(100%-2.5rem)] w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />

      <div className="pointer-events-none absolute inset-x-3 top-1/2 z-10 h-[74px] -translate-y-1/2 rounded-2xl border border-[#FFD700]/20 bg-[#FFD700]/[0.035] shadow-[0_0_24px_rgba(255,215,0,0.08)]" />

      <motion.div
        key={spinKey}
        initial={{ y: 0 }}
        animate={
          isSpinning
            ? {
                y: [0, targetY + 34, targetY - 14, targetY],
                filter: [
                  "blur(0px)",
                  "blur(5px)",
                  isDramaReel ? "blur(2px)" : "blur(1px)",
                  "blur(0px)",
                ],
              }
            : {
                y: targetY,
                filter: "blur(0px)",
              }
        }
        transition={{
          duration: spinDuration,
          times: [0, 0.82, 0.93, 1],
          ease: isDramaReel
            ? ["linear", [0.08, 0.82, 0.16, 1], "easeOut"]
            : ["linear", [0.18, 0.78, 0.22, 1], "easeOut"],
        }}
        onAnimationComplete={() => {
          if (!isSpinning) return;
          setHasSettled(true);
          onStop?.(reelIndex);
        }}
      >
        {track.map((symbolKey, index) => {
          const safeSymbolKey = normalizeSymbol(symbolKey);
const symbol = SYMBOLS[safeSymbolKey];

          return (
            <div
              key={`${symbolKey}-${index}`}
              className="flex h-28 flex-col items-center justify-center"
            >
              <div
                className={`text-5xl leading-none drop-shadow-[0_0_20px_rgba(255,215,0,0.35)] ${symbol.accent}`}
              >
                {symbol.glyph}
              </div>

              <div className="mt-2 font-mono text-[10px] font-black uppercase tracking-[0.22em] text-white/55">
                {symbol.label}
              </div>
            </div>
          );
        })}
      </motion.div>

      {isDramaReel && isSpinning && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-30 rounded-[2rem] border border-[#FFD700]/30 bg-[#8B0000]/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.7, 0.25, 0.75, 0] }}
          transition={{
            delay: 1.3,
            duration: 2,
            ease: "easeInOut",
          }}
        />
      )}
    </motion.div>
  );
}