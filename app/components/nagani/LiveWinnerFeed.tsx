"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Flame, Trophy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/app/lib/supabase";

type LiveSpinRow = {
  id?: string | number | null;
  user_id?: string | null;
  bet_amount?: number | string | null;
  win_amount?: number | string | null;
  room_name?: string | null;
  created_at?: string | null;
};

type FeedItem = {
  id: string;
  player: string;
  roomName: string;
  betAmount: number;
  winAmount: number;
  isMassive: boolean;
};

function toNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function maskPlayerId(userId?: string | null) {
  if (!userId) return "Player***";
  return `Player ${userId.slice(0, 4)}***`;
}

function buildFeedItem(spin: LiveSpinRow): FeedItem | null {
  const winAmount = toNumber(spin.win_amount);

  if (winAmount <= 0) return null;

  const betAmount = toNumber(spin.bet_amount);
  const isMassive = betAmount > 0 ? winAmount > betAmount * 50 : false;

  return {
    id: String(
      spin.id ??
        `${spin.user_id ?? "anon"}-${spin.created_at ?? Date.now()}-${Math.random()}`
    ),
    player: maskPlayerId(spin.user_id),
    roomName: spin.room_name || "Nagani Room",
    betAmount,
    winAmount,
    isMassive,
  };
}

export default function LiveWinnerFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    function handleNewWinEvent(spin: LiveSpinRow) {
      const item = buildFeedItem(spin);

      if (!item) return;

      setItems((current) => [item, ...current].slice(0, 3));

      const timer = window.setTimeout(() => {
        setItems((current) => current.filter((entry) => entry.id !== item.id));
      }, 4000);

      timers.current.push(timer);
    }

    const channel = supabase
      .channel("live-spins")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "spin_logs" },
        (payload) => {
          const spin = payload.new as LiveSpinRow;

          if (toNumber(spin.win_amount) > 0) {
            handleNewWinEvent(spin);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);

      timers.current.forEach((timer) => window.clearTimeout(timer));
      timers.current = [];
    };
  }, []);

  return (
    <div className="pointer-events-none fixed left-4 right-4 top-4 z-40 space-y-2 sm:left-auto sm:w-[360px]">
      <AnimatePresence initial={false}>
        {items.map((item) => {
          const multiplier =
            item.betAmount > 0 ? item.winAmount / item.betAmount : 0;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: -18, x: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, x: 18, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className={`pointer-events-auto overflow-hidden rounded-[1.35rem] border p-3 backdrop-blur-2xl ${
                item.isMassive
                  ? "border-[#FFD700]/50 bg-black/60 shadow-[0_0_38px_rgba(255,215,0,0.24),0_0_50px_rgba(139,0,0,0.22)]"
                  : "border-white/10 bg-black/40 shadow-[0_0_24px_rgba(255,255,255,0.06)]"
              }`}
            >
              <div
                className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${
                  item.isMassive ? "via-[#FFD700]/80" : "via-white/30"
                } to-transparent`}
              />

              <div className="flex items-start gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${
                    item.isMassive
                      ? "border-[#FFD700]/35 bg-[#FFD700]/15 text-[#FFD700]"
                      : "border-white/10 bg-white/[0.06] text-white/70"
                  }`}
                >
                  {item.isMassive ? (
                    <Flame className="h-5 w-5" />
                  ) : (
                    <Trophy className="h-5 w-5" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div
                    className={`font-mono text-[9px] font-black uppercase tracking-[0.2em] ${
                      item.isMassive ? "text-[#FFD700]" : "text-white/45"
                    }`}
                  >
                    {item.isMassive ? "Massive Win" : "Live Winner"}
                  </div>

                  <p className="mt-1 text-sm font-bold leading-5 text-white/85">
                    👤 {item.player} just won{" "}
                    <span
                      className={
                        item.isMassive ? "text-[#FFD700]" : "text-white"
                      }
                    >
                      {formatMoney(item.winAmount)}
                    </span>{" "}
                    in {item.roomName}!
                  </p>

                  {multiplier > 0 && (
                    <div className="mt-2 inline-flex rounded-full border border-white/10 bg-white/[0.055] px-2.5 py-1 font-mono text-[9px] font-black uppercase tracking-[0.16em] text-white/45">
                      {multiplier.toFixed(1)}x payout
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}