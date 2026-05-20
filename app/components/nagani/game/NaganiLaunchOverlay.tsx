"use client";

import { motion } from "framer-motion";
import { Flame } from "lucide-react";

type NaganiLaunchOverlayProps = {
  roomName: string;
};

export default function NaganiLaunchOverlay({
  roomName,
}: NaganiLaunchOverlayProps) {
  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-center justify-center overflow-hidden bg-[#040000] px-6 text-white"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-700/28 blur-[125px]" />
        <div className="absolute bottom-[-14rem] left-1/2 h-[28rem] w-[44rem] -translate-x-1/2 rounded-full bg-[#FFD700]/10 blur-[100px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(250,204,21,0.15),transparent_44%)]" />
      </div>

      <motion.div
        className="relative w-full max-w-md text-center"
        initial={{ y: 18, scale: 0.96, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] border border-[#FFD700]/35 bg-gradient-to-b from-red-900/80 to-black shadow-[0_0_70px_rgba(250,204,21,0.18)]">
          <Flame className="h-12 w-12 text-[#FFD700]" />
        </div>

        <div className="mt-6 font-mono text-[10px] font-black uppercase tracking-[0.38em] text-[#FFD700]/75">
          နဂါးနီ · Live Casino
        </div>

        <h1 className="mt-2 bg-gradient-to-r from-white via-[#FFD700] to-red-500 bg-clip-text text-5xl font-black tracking-tight text-transparent">
          NAGANI
        </h1>

        <div className="mt-3 font-mono text-[10px] font-black uppercase tracking-[0.24em] text-white/38">
          {roomName} Session Launch
        </div>

        <div className="mx-auto mt-8 h-2 max-w-xs overflow-hidden rounded-full border border-[#FFD700]/20 bg-black/75">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-red-700 via-[#FFD700] to-yellow-100"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.22, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}