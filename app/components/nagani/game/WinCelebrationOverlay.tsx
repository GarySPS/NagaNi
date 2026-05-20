"use client";

import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import GameSessionAsset from "./GameSessionAsset";

type SpinResultForCelebration = {
  isWin: boolean;
  payout: number;
} | null;

type WinCelebrationOverlayProps = {
  active: boolean;
  result: SpinResultForCelebration;
  betAmount: number;
};

function formatCredits(value: number) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function WinCelebrationOverlay({
  active,
  result,
  betAmount,
}: WinCelebrationOverlayProps) {
  if (!active || !result?.isWin) {
    return null;
  }

  const isBigWin = result.payout >= betAmount * 50;
  const title = isBigWin ? "BIG WIN" : "DRAGON WIN";
  const subtitle = isBigWin
    ? "Fire jackpot energy unlocked"
    : "Winning line confirmed";

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[75] flex items-center justify-center px-5 text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className="absolute inset-0 bg-black/38 backdrop-blur-[2px]" />

      <GameSessionAsset
        src="/assets/nagani/effects/fire-glow.webp"
        alt="Nagani win glow"
        className="absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 object-contain opacity-55"
      />

      <motion.div
        className={`relative w-full max-w-sm overflow-hidden rounded-[2rem] border p-6 text-center shadow-[0_0_90px_rgba(250,204,21,0.24)] ${
          isBigWin
            ? "border-[#FFD700]/55 bg-gradient-to-b from-[#5a0909]/96 via-[#160202]/96 to-black"
            : "border-[#FFD700]/35 bg-gradient-to-b from-[#2a0505]/96 via-[#0b0101]/96 to-black"
        }`}
        initial={{ y: 24, scale: 0.86, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 10, scale: 0.94, opacity: 0 }}
        transition={{ type: "spring", stiffness: 210, damping: 18 }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(250,204,21,0.22),transparent_48%)]" />
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD700] to-transparent" />

        <motion.div
          className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-[1.75rem] border border-[#FFD700]/35 bg-[#FFD700]/10 text-[#FFD700] shadow-[0_0_50px_rgba(250,204,21,0.28)]"
          animate={{
            scale: [1, 1.08, 1],
            rotate: isBigWin ? [0, -3, 3, 0] : [0, 0],
          }}
          transition={{ duration: 0.75, repeat: 2 }}
        >
          <Flame className="h-10 w-10" />
        </motion.div>

        <div className="relative mt-5 font-mono text-[9px] font-black uppercase tracking-[0.32em] text-[#FFD700]/75">
          {subtitle}
        </div>

        <motion.h2
          className="relative mt-2 bg-gradient-to-r from-white via-[#FFD700] to-red-500 bg-clip-text text-5xl font-black tracking-tight text-transparent"
          animate={{
            textShadow: [
              "0 0 12px rgba(250,204,21,0.25)",
              "0 0 30px rgba(250,204,21,0.55)",
              "0 0 12px rgba(250,204,21,0.25)",
            ],
          }}
          transition={{ duration: 0.9, repeat: 2 }}
        >
          {title}
        </motion.h2>

        <div className="relative mt-5 rounded-[1.5rem] border border-[#FFD700]/25 bg-black/45 px-4 py-4">
          <div className="font-mono text-[9px] font-black uppercase tracking-[0.22em] text-white/38">
            Win Amount
          </div>

          <div className="mt-1 font-mono text-4xl font-black text-[#FFD700]">
            {formatCredits(result.payout)}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}