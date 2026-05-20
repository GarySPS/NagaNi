//app>live>page.tsx

"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Crown,
  Flame,
  Loader2,
  Radio,
  RefreshCw,
  Trophy,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import NaganiBottomNav from "@/app/components/nagani/NaganiBottomNav";

type LiveSpinRow = {
  id?: string | number | null;
  user_id?: string | null;
  bet_amount?: number | string | null;
  win_amount?: number | string | null;
  room_name?: string | null;
  created_at?: string | null;
};

type LiveWinner = {
  id: string;
  player: string;
  roomName: string;
  winAmount: number;
  betAmount: number;
  multiplier: number;
  createdAt: string;
  isMassive: boolean;
};

type RoomRank = {
  name: string;
  tag: string;
  hotScore: string;
  volume: string;
  accent: "red" | "gold" | "green";
};

type ToastState = {
  title: string;
  message: string;
} | null;

const MOCK_WINNERS: LiveWinner[] = [
  {
    id: "mock-1",
    player: "Player 8f2a***",
    roomName: "Dragon's Peak",
    winAmount: 12500,
    betAmount: 25,
    multiplier: 500,
    createdAt: "Just now",
    isMassive: true,
  },
  {
    id: "mock-2",
    player: "Player a19c***",
    roomName: "Golden Buffalo",
    winAmount: 1250,
    betAmount: 25,
    multiplier: 50,
    createdAt: "2 min ago",
    isMassive: false,
  },
  {
    id: "mock-3",
    player: "Player c77d***",
    roomName: "Green Valley",
    winAmount: 375,
    betAmount: 25,
    multiplier: 15,
    createdAt: "5 min ago",
    isMassive: false,
  },
];

const ROOM_RANKS: RoomRank[] = [
  {
    name: "Dragon's Peak",
    tag: "High Heat",
    hotScore: "98%",
    volume: "$48.2K",
    accent: "red",
  },
  {
    name: "Golden Buffalo",
    tag: "Most Played",
    hotScore: "84%",
    volume: "$22.7K",
    accent: "gold",
  },
  {
    name: "Green Valley",
    tag: "Stable Wins",
    hotScore: "61%",
    volume: "$9.4K",
    accent: "green",
  },
];

function toNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value: number) {
  return `$${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function maskPlayerId(userId?: string | null) {
  if (!userId) return "Player***";
  return `Player ${userId.slice(0, 4)}***`;
}

function getTimeLabel(value?: string | null) {
  if (!value) return "Live";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Live";

  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildLiveWinner(spin: LiveSpinRow): LiveWinner | null {
  const winAmount = toNumber(spin.win_amount);

  if (winAmount <= 0) return null;

  const betAmount = toNumber(spin.bet_amount);
  const multiplier = betAmount > 0 ? winAmount / betAmount : 0;

  return {
    id: String(
      spin.id ??
        `${spin.user_id ?? "anon"}-${
          spin.created_at ?? Date.now()
        }-${Math.random()}`
    ),
    player: maskPlayerId(spin.user_id),
    roomName: spin.room_name || "Nagani Room",
    winAmount,
    betAmount,
    multiplier,
    createdAt: getTimeLabel(spin.created_at),
    isMassive: betAmount > 0 ? winAmount > betAmount * 50 : false,
  };
}

function getRankVisual(accent: RoomRank["accent"]) {
  if (accent === "green") {
    return {
      border: "border-emerald-300/20",
      bg: "from-emerald-400/22 via-emerald-500/8 to-black/60",
      text: "text-emerald-100",
    };
  }

  if (accent === "gold") {
    return {
      border: "border-[#FFD700]/25",
      bg: "from-[#FFD700]/22 via-yellow-500/8 to-black/60",
      text: "text-[#FFD700]",
    };
  }

  return {
    border: "border-red-300/25",
    bg: "from-red-500/28 via-[#FFD700]/8 to-black/65",
    text: "text-red-100",
  };
}

function LivePageAsset({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return null;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}

export default function LivePage() {
  const router = useRouter();
  const toastTimer = useRef<number | null>(null);

  const [authLoading, setAuthLoading] = useState(true);
  const [winners, setWinners] = useState<LiveWinner[]>(MOCK_WINNERS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  const totalWinVolume = useMemo(() => {
    return winners.reduce((sum, winner) => sum + winner.winAmount, 0);
  }, [winners]);

  const massiveWins = useMemo(() => {
    return winners.filter((winner) => winner.isMassive).length;
  }, [winners]);

  useEffect(() => {
    let mounted = true;

    async function bootLivePage() {
      const { data, error } = await supabase.auth.getUser();

      if (!mounted) return;

      if (error || !data.user) {
        router.replace("/auth");
        return;
      }

      setAuthLoading(false);
    }

    void bootLivePage();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT" || !session?.user) {
        router.replace("/auth");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();

      if (toastTimer.current) {
        window.clearTimeout(toastTimer.current);
      }
    };
  }, [router]);

  useEffect(() => {
    const channel = supabase
      .channel("live-page-spins")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "spin_logs" },
        (payload) => {
          const winner = buildLiveWinner(payload.new as LiveSpinRow);

          if (!winner) return;

          setWinners((current) => [winner, ...current].slice(0, 12));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  function showToast(nextToast: ToastState) {
    setToast(nextToast);

    if (toastTimer.current) {
      window.clearTimeout(toastTimer.current);
    }

    toastTimer.current = window.setTimeout(() => {
      setToast(null);
    }, 3000);
  }

  function refreshBoard() {
    setIsRefreshing(true);

    window.setTimeout(() => {
      setIsRefreshing(false);
      showToast({
        title: "Live Board",
        message: "Winner board refreshed.",
      });
    }, 650);
  }

  if (authLoading) {
    return (
      <main className="nagani-page text-white">
        <div className="mx-auto flex min-h-dvh w-full max-w-md items-center justify-center px-5">
          <div className="w-full rounded-[2rem] border border-[#FFD700]/20 bg-white/[0.05] p-8 text-center shadow-[0_0_80px_rgba(255,215,0,0.08)] backdrop-blur-xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#FFD700]/20 bg-[#FFD700]/10">
              <Loader2 className="h-5 w-5 animate-spin text-[#FFD700]" />
            </div>

            <p className="font-mono text-[10px] font-black uppercase tracking-[0.28em] text-[#FFD700]/70">
              Opening Live Board
            </p>

            <h1 className="mt-3 text-2xl font-black tracking-tight">
              NAGANI
            </h1>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="nagani-page text-white">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="fixed left-4 right-4 top-4 z-50 mx-auto max-w-md rounded-[1.4rem] border border-[#FFD700]/25 bg-black/70 p-3 shadow-[0_0_40px_rgba(255,215,0,0.14)] backdrop-blur-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#FFD700]/25 bg-[#FFD700]/10 text-[#FFD700]">
                <Radio className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="font-mono text-[8px] font-black uppercase tracking-[0.22em] text-[#FFD700]/80">
                  {toast.title}
                </div>

                <p className="mt-1 truncate text-sm font-bold text-white/85">
                  {toast.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setToast(null)}
                className="rounded-full border border-white/10 bg-white/[0.04] p-1 text-white/40"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

<div className="pointer-events-none fixed inset-0">
  <LivePageAsset
    src="/assets/nagani/backgrounds/live.webp"
    alt="Nagani live winner background"
    className="absolute inset-0 h-full w-full object-cover opacity-24"
  />

  <div className="absolute inset-0 bg-[#050101]/76" />
  <div className="absolute left-1/2 top-[-10rem] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-nagani-dragon-red/45 blur-[120px]" />
  <div className="absolute bottom-[-14rem] right-[-10rem] h-[28rem] w-[28rem] rounded-full bg-nagani-gold/10 blur-[120px]" />
  <div className="absolute left-[-12rem] top-[35%] h-[24rem] w-[24rem] rounded-full bg-red-600/12 blur-[120px]" />
  <div className="nagani-grid-overlay absolute inset-0 opacity-40" />
</div>

      <section className="relative mx-auto min-h-dvh w-full max-w-md px-4 pb-36 pt-4">
        <header className="sticky top-0 z-30 -mx-4 border-b border-white/10 bg-[#120304]/88 px-4 pb-3 pt-3 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[#FFD700]/25 bg-[#FFD700]/10 text-[#FFD700]">
                  <Radio className="h-5 w-5" />
                </div>

                <div>
                  <div className="font-mono text-[9px] font-black uppercase tracking-[0.22em] text-[#FFD700]/70">
                    Live
                  </div>

                  <h1 className="text-xl font-black leading-none tracking-tight text-white">
                    Winner Board
                  </h1>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={refreshBoard}
              disabled={isRefreshing}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.055] text-white/60 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </header>

<section className="relative mt-4 overflow-hidden rounded-[2.15rem] border border-[#FFD700]/25 bg-gradient-to-br from-red-500/30 via-[#FFD700]/10 to-black/75 p-4 shadow-[0_0_70px_rgba(239,68,68,0.18)]">
  <LivePageAsset
    src="/assets/nagani/banners/live-winners.webp"
    alt="Nagani live winners banner"
    className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20"
  />

  <LivePageAsset
    src="/assets/nagani/effects/dragon-glow.webp"
    alt="Nagani dragon glow"
    className="pointer-events-none absolute -right-24 -top-20 h-80 w-80 object-contain opacity-35"
  />

  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/5 via-black/35 to-black/85" />
  <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/80 to-transparent" />
  <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-red-500/12 blur-[80px]" />

  <div className="relative z-10">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#FFD700]/25 bg-[#FFD700]/10 px-3 py-1 font-mono text-[8px] font-black uppercase tracking-[0.2em] text-[#FFD700]">
          <Radio className="h-3 w-3 animate-pulse" />
          Live Heat
        </div>

        <h2 className="mt-3 text-3xl font-black leading-none tracking-tight text-white">
          Live Winners
        </h2>

        <p className="mt-2 max-w-[15rem] text-xs font-semibold leading-5 text-white/48">
          Realtime win activity from Nagani rooms. Big payouts rise to the top of the board.
        </p>
      </div>

      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[2rem] border border-[#FFD700]/30 bg-[#FFD700]/10 text-[#FFD700] shadow-[0_0_30px_rgba(255,215,0,0.14)]">
        <Flame className="h-10 w-10 drop-shadow-[0_0_18px_rgba(255,215,0,0.35)]" />
      </div>
    </div>

    <div className="mt-5 grid grid-cols-2 gap-3">
      <div className="rounded-[1.35rem] border border-[#FFD700]/20 bg-black/35 p-3">
        <div className="font-mono text-[8px] font-black uppercase tracking-[0.18em] text-[#FFD700]/60">
          Win Volume
        </div>

        <div className="mt-1 truncate font-mono text-xl font-black text-[#FFD700]">
          {formatMoney(totalWinVolume)}
        </div>

        <div className="mt-1 text-[10px] font-semibold text-white/32">
          Visible board total
        </div>
      </div>

      <div className="rounded-[1.35rem] border border-red-300/20 bg-red-500/10 p-3">
        <div className="font-mono text-[8px] font-black uppercase tracking-[0.18em] text-red-100/60">
          Dragon Wins
        </div>

        <div className="mt-1 font-mono text-xl font-black text-red-100">
          {massiveWins}
        </div>

        <div className="mt-1 text-[10px] font-semibold text-white/32">
          Dragon-level payouts
        </div>
      </div>
    </div>
  </div>
</section>

<section className="relative mt-4 overflow-hidden rounded-[2rem] border border-[#FFD700]/18 bg-gradient-to-br from-black/70 via-[#180405]/80 to-red-950/35 p-4 shadow-[0_0_55px_rgba(255,215,0,0.08)]">
  <LivePageAsset
    src="/assets/nagani/ui/room-ranking.webp"
    alt="Nagani room ranking"
    className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-14"
  />

  <div className="pointer-events-none absolute -right-20 -top-16 h-52 w-52 rounded-full bg-[#FFD700]/10 blur-[75px]" />
  <div className="pointer-events-none absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-red-500/10 blur-[75px]" />
  <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/65 to-transparent" />

  <div className="relative z-10">
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <div className="font-mono text-[9px] font-black uppercase tracking-[0.22em] text-[#FFD700]/70">
          Hot Rooms
        </div>

        <h2 className="mt-1 text-2xl font-black tracking-tight">
          Room Ranking
        </h2>
      </div>

      <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/15 bg-emerald-400/10 px-3 py-1 font-mono text-[8px] font-black uppercase tracking-[0.16em] text-emerald-100/65">
        <Radio className="h-3 w-3 animate-pulse" />
        Live
      </div>
    </div>

    <div className="space-y-3">
      {ROOM_RANKS.map((room, index) => {
        const visual = getRankVisual(room.accent);
        const isTopRoom = index === 0;

        return (
          <motion.button
            key={room.name}
            type="button"
            onClick={() =>
              router.push(`/?room=${encodeURIComponent(room.name)}`)
            }
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              delay: index * 0.045,
              type: "spring",
              stiffness: 150,
              damping: 18,
            }}
            className={`group relative w-full overflow-hidden rounded-[1.55rem] border ${visual.border} bg-gradient-to-br ${visual.bg} p-4 text-left shadow-[0_0_28px_rgba(0,0,0,0.22)] active:scale-[0.985]`}
          >
            {isTopRoom && (
              <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/90 to-transparent" />
            )}

            <div className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-[#FFD700]/10 blur-[48px]" />
            <div className="pointer-events-none absolute -bottom-14 -left-10 h-28 w-28 rounded-full bg-red-500/10 blur-[48px]" />

            <div className="relative z-10 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.25rem] border font-mono text-sm font-black ${
                    isTopRoom
                      ? "border-[#FFD700]/35 bg-[#FFD700]/12 text-[#FFD700] shadow-[0_0_22px_rgba(255,215,0,0.12)]"
                      : "border-white/10 bg-black/25 text-white/70"
                  }`}
                >
                  {isTopRoom ? (
                    <Crown className="h-5 w-5" />
                  ) : (
                    `#${index + 1}`
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="truncate font-black text-white">
                      {room.name}
                    </div>

                    {isTopRoom && (
                      <span className="rounded-full border border-red-300/20 bg-red-500/10 px-2 py-0.5 font-mono text-[7px] font-black uppercase tracking-[0.14em] text-red-100">
                        Hot
                      </span>
                    )}
                  </div>

                  <div className="mt-1 font-mono text-[9px] font-black uppercase tracking-[0.16em] text-white/35">
                    {room.tag}
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full ${
                          room.accent === "green"
                            ? "bg-emerald-300/70"
                            : room.accent === "gold"
                              ? "bg-[#FFD700]/75"
                              : "bg-red-300/75"
                        }`}
                        style={{ width: room.hotScore }}
                      />
                    </div>

                    <span className="font-mono text-[8px] font-black uppercase tracking-[0.12em] text-white/28">
                      Heat
                    </span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <div className={`font-mono text-xl font-black ${visual.text}`}>
                  {room.hotScore}
                </div>

                <div className="mt-1 font-mono text-[9px] font-black uppercase tracking-[0.14em] text-white/35">
                  {room.volume}
                </div>

                <div className="mt-2 text-lg leading-none text-white/25 transition group-active:translate-x-0.5">
                  ›
                </div>
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  </div>
</section>

<section className="relative mt-5 overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.055] via-black/50 to-red-950/30 p-4 shadow-[0_0_55px_rgba(0,0,0,0.35)]">
  <LivePageAsset
    src="/assets/nagani/ui/winner-feed.webp"
    alt="Nagani winner feed"
    className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-12"
  />

  <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-[#FFD700]/10 blur-[75px]" />
  <div className="pointer-events-none absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-red-500/10 blur-[75px]" />
  <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/55 to-transparent" />

  <div className="relative z-10">
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <div className="font-mono text-[9px] font-black uppercase tracking-[0.22em] text-[#FFD700]/70">
          Big Win Feed
        </div>

        <h2 className="mt-1 text-2xl font-black tracking-tight">
          Recent Winners
        </h2>
      </div>

      <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/25 px-3 py-1 font-mono text-[8px] font-black uppercase tracking-[0.16em] text-white/40">
        <Radio className="h-3 w-3 animate-pulse text-emerald-200/70" />
        {winners.length} Rows
      </div>
    </div>

    <div className="space-y-3">
      {winners.map((winner, index) => (
        <motion.div
          key={winner.id}
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            delay: index < 5 ? index * 0.025 : 0,
            type: "spring",
            stiffness: 160,
            damping: 20,
          }}
          className={`relative overflow-hidden rounded-[1.55rem] border p-4 ${
            winner.isMassive
              ? "border-[#FFD700]/35 bg-[#FFD700]/[0.075] shadow-[0_0_34px_rgba(255,215,0,0.14)]"
              : "border-white/10 bg-white/[0.045]"
          }`}
        >
          {winner.isMassive && (
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/85 to-transparent" />
          )}

          <div className="pointer-events-none absolute -right-12 -top-14 h-32 w-32 rounded-full bg-[#FFD700]/10 blur-[52px]" />
          <div className="pointer-events-none absolute -bottom-14 -left-12 h-32 w-32 rounded-full bg-red-500/10 blur-[52px]" />

          <div className="relative z-10 flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.25rem] border ${
                  winner.isMassive
                    ? "border-[#FFD700]/30 bg-[#FFD700]/10 text-[#FFD700]"
                    : "border-white/10 bg-white/[0.055] text-white/50"
                }`}
              >
                {winner.isMassive ? (
                  <Crown className="h-5 w-5" />
                ) : (
                  <Trophy className="h-5 w-5" />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="truncate font-black text-white/88">
                    {winner.player}
                  </div>

                  {winner.isMassive && (
                    <span className="rounded-full border border-[#FFD700]/20 bg-[#FFD700]/10 px-2 py-0.5 font-mono text-[7px] font-black uppercase tracking-[0.14em] text-[#FFD700]">
                      Dragon
                    </span>
                  )}
                </div>

                <div className="mt-1 truncate font-mono text-[9px] font-black uppercase tracking-[0.16em] text-white/35">
                  {winner.roomName} · {winner.createdAt}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/10 bg-black/25 px-2 py-1 font-mono text-[8px] font-black uppercase tracking-[0.12em] text-white/35">
                    Bet {formatMoney(winner.betAmount)}
                  </span>

                  {winner.multiplier > 0 && (
                    <span
                      className={`rounded-full border px-2 py-1 font-mono text-[8px] font-black uppercase tracking-[0.12em] ${
                        winner.isMassive
                          ? "border-[#FFD700]/20 bg-[#FFD700]/10 text-[#FFD700]"
                          : "border-red-300/15 bg-red-500/10 text-red-100/70"
                      }`}
                    >
                      {winner.multiplier.toFixed(1)}x
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="shrink-0 text-right">
              <div
                className={`font-mono text-xl font-black leading-none ${
                  winner.isMassive ? "text-[#FFD700]" : "text-white"
                }`}
              >
                {formatMoney(winner.winAmount)}
              </div>

              <div className="mt-1 font-mono text-[8px] font-black uppercase tracking-[0.14em] text-white/28">
                Win Amount
              </div>

              {winner.isMassive && (
                <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-red-300/15 bg-red-500/10 px-2 py-1 font-mono text-[7px] font-black uppercase tracking-[0.12em] text-red-100/70">
                  <Flame className="h-2.5 w-2.5" />
                  Big
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
</section>
      </section>

<NaganiBottomNav active="live" />
    </main>
  );
}