"use client";

import { motion } from "framer-motion";
import { RotateCw, Smartphone } from "lucide-react";
import { useState } from "react";

type RotatePhoneWelcomeProps = {
  onClose: (doNotShowAgain: boolean) => void;
};

export default function RotatePhoneWelcome({
  onClose,
}: RotatePhoneWelcomeProps) {
  const [doNotShowAgain, setDoNotShowAgain] = useState(false);

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/72 px-5 text-white backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      <motion.div
        className="relative w-full max-w-sm overflow-hidden rounded-[2rem] border border-[#FFD700]/25 bg-gradient-to-b from-[#260303]/96 via-[#0b0101]/98 to-black p-5 text-center shadow-[0_0_90px_rgba(250,204,21,0.16)]"
        initial={{ y: 18, scale: 0.96, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 10, scale: 0.98, opacity: 0 }}
        transition={{ duration: 0.32, ease: "easeOut" }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(250,204,21,0.16),transparent_42%)]" />

        <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-[1.35rem] border border-[#FFD700]/30 bg-[#FFD700]/10 shadow-[0_0_38px_rgba(250,204,21,0.2)]">
          <Smartphone className="h-8 w-8 text-[#FFD700]" />
        </div>

        <div className="relative mt-4 font-mono text-[9px] font-black uppercase tracking-[0.28em] text-[#FFD700]/70">
          Best Experience
        </div>

        <h2 className="relative mt-2 text-2xl font-black leading-tight text-white">
          Rotate Your Phone
        </h2>

        <p className="relative mt-3 text-sm font-semibold leading-6 text-white/55">
          Nagani is built like a casino game cabinet. Rotate your phone sideways
          for a wider reel view and better spin experience.
        </p>

        <div className="relative mt-4 flex items-center justify-center gap-3 rounded-[1.35rem] border border-white/10 bg-white/[0.045] px-4 py-3">
          <Smartphone className="h-6 w-6 text-white/45" />
          <RotateCw className="h-5 w-5 text-[#FFD700]" />
          <div className="h-6 w-10 rounded-lg border border-[#FFD700]/40 bg-[#FFD700]/10" />
        </div>

        <label className="relative mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-[1.15rem] border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold text-white/55">
          <input
            type="checkbox"
            checked={doNotShowAgain}
            onChange={(event) => setDoNotShowAgain(event.target.checked)}
            className="h-4 w-4 accent-[#FFD700]"
          />
          Do not show again
        </label>

        <button
          type="button"
          onClick={() => onClose(doNotShowAgain)}
          className="nagani-gold-button relative mt-5 w-full rounded-[1.45rem] px-5 py-3 font-black uppercase tracking-[0.22em] active:scale-[0.98]"
        >
          Continue
        </button>

        <p className="relative mt-3 text-[11px] font-semibold leading-5 text-white/32">
          Portrait mode still works. Landscape is recommended for full cabinet
          size.
        </p>
      </motion.div>
    </motion.div>
  );
}