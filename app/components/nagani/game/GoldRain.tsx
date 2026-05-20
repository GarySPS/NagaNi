"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo } from "react";

type GoldRainProps = {
  active: boolean;
};

export default function GoldRain({ active }: GoldRainProps) {
  const particles = useMemo(
    () =>
      Array.from({ length: 52 }, (_, index) => ({
        id: index,
        left: `${Math.random() * 100}%`,
        delay: Math.random() * 0.75,
        duration: 1.15 + Math.random() * 1.55,
        size: 4 + Math.random() * 8,
      })),
    [active]
  );

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[70] overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,215,0,0.24),transparent_56%)]" />

          {particles.map((particle) => (
            <motion.span
              key={particle.id}
              className="absolute top-[-32px] rounded-full bg-[#FFD700] shadow-[0_0_18px_rgba(255,215,0,0.95)]"
              style={{
                left: particle.left,
                width: particle.size,
                height: particle.size,
              }}
              initial={{ y: -60, opacity: 0, rotate: 0 }}
              animate={{ y: "110vh", opacity: [0, 1, 1, 0], rotate: 420 }}
              transition={{
                delay: particle.delay,
                duration: particle.duration,
                ease: "easeIn",
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}