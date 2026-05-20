"use client";

import { motion } from "framer-motion";
import { Flame } from "lucide-react";

export default function NaganiPageLoading() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#040000] px-6 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-700/25 blur-[110px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(250,204,21,0.12),transparent_42%)]" />
      </div>

      <div className="relative w-full max-w-sm rounded-[2.25rem] border border-[#FFD700]/20 bg-black/45 p-8 text-center shadow-[0_0_90px_rgba(250,204,21,0.12)] backdrop-blur-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.4rem] border border-[#FFD700]/30 bg-[#FFD700]/10 shadow-[0_0_40px_rgba(250,204,21,0.22)]">
          <Flame className="h-8 w-8 text-[#FFD700]" />
        </div>

        <div className="mt-5 font-mono text-[10px] font-black uppercase tracking-[0.34em] text-[#FFD700]/70">
          Loading Session
        </div>

        <h1 className="mt-2 text-4xl font-black tracking-tight text-white">
          NAGANI
        </h1>

        <div className="mt-6 h-2 overflow-hidden rounded-full border border-[#FFD700]/20 bg-black/70">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-red-700 via-[#FFD700] to-yellow-200"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.15, ease: "easeInOut" }}
          />
        </div>
      </div>
    </main>
  );
}