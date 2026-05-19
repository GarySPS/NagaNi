"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Coins,
  Database,
  Flame,
  Gauge,
  Layers3,
  Loader2,
  LogOut,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Terminal,
  TrendingUp,
  Vault,
  WalletCards,
} from "lucide-react";
import { fundWallet, getDashboardStats, getWallet } from "../lib/actions";
import { supabase } from "../lib/supabase";

type RoomName = "Green Valley" | "Golden Buffalo" | "Dragon's Peak";

type RoomStats = {
  spins: number;
  turnover: number;
  wins: number;
  ggr: number;
};

type RecentLog = {
  bet_amount: number;
  win_amount: number;
  is_near_miss: boolean;
  created_at: string;
  room_name?: RoomName | string | null;
};

type DashboardStats = {
  totalSpins: number;
  totalTurnover: number;
  ggr: number;
  recentLogs: RecentLog[];
  roomStats: Record<RoomName, RoomStats>;
};

type WalletState = {
  playable_balance: number;
  locked_vault: number;
};

const ROOM_ORDER: RoomName[] = [
  "Green Valley",
  "Golden Buffalo",
  "Dragon's Peak",
];

const EMPTY_ROOM_STATS: Record<RoomName, RoomStats> = {
  "Green Valley": { spins: 0, turnover: 0, wins: 0, ggr: 0 },
  "Golden Buffalo": { spins: 0, turnover: 0, wins: 0, ggr: 0 },
  "Dragon's Peak": { spins: 0, turnover: 0, wins: 0, ggr: 0 },
};

function toNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value: number) {
  return Number(value || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatNumber(value: number) {
  return Number(value || 0).toLocaleString("en-US");
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "0.0%";

  return `${value.toFixed(1)}%`;
}

function getTime(log: RecentLog) {
  if (!log.created_at) return "—";

  const date = new Date(log.created_at);

  if (Number.isNaN(date.getTime())) {
    return String(log.created_at);
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getRoomVisual(roomName: RoomName) {
  if (roomName === "Green Valley") {
    return {
      tag: "LOW VOL",
      border: "border-emerald-400/20",
      bg: "bg-emerald-400/[0.055]",
      text: "text-emerald-200",
      glow: "shadow-[0_0_38px_rgba(16,185,129,0.08)]",
    };
  }

  if (roomName === "Golden Buffalo") {
    return {
      tag: "MID VOL",
      border: "border-[#FFD700]/20",
      bg: "bg-[#FFD700]/[0.06]",
      text: "text-[#FFD700]",
      glow: "shadow-[0_0_38px_rgba(255,215,0,0.08)]",
    };
  }

  return {
    tag: "HIGH VOL",
    border: "border-red-400/25",
    bg: "bg-red-500/[0.07]",
    text: "text-red-100",
    glow: "shadow-[0_0_46px_rgba(239,68,68,0.12)]",
  };
}

function normalizeRoomStats(
  incoming: Partial<Record<RoomName, Partial<RoomStats>>> | undefined
): Record<RoomName, RoomStats> {
  return ROOM_ORDER.reduce((acc, roomName) => {
    const room = incoming?.[roomName];

    acc[roomName] = {
      spins: toNumber(room?.spins),
      turnover: toNumber(room?.turnover),
      wins: toNumber(room?.wins),
      ggr: toNumber(room?.ggr),
    };

    return acc;
  }, { ...EMPTY_ROOM_STATS });
}

export default function PitchDashboardPage() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [loading, setLoading] = useState(true);
  const [walletLoading, setWalletLoading] = useState(true);
  const [funding, setFunding] = useState(false);
  const [statusText, setStatusText] = useState(
    "Operator telemetry console ready."
  );

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const { data, error } = await supabase.auth.getUser();

      if (!mounted) return;

      if (error || !data.user) {
        setAuthLoading(false);
        router.replace("/auth");
        return;
      }

      setUserId(data.user.id);
      setAuthLoading(false);
    }

    void loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      if (!session?.user) {
        setUserId(null);
        setAuthLoading(false);
        router.replace("/auth");
        return;
      }

      setUserId(session.user.id);
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  const loadDashboard = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);

      const data = await getDashboardStats(userId);

      setStats({
        totalSpins: toNumber(data?.totalSpins),
        totalTurnover: toNumber(data?.totalTurnover),
        ggr: toNumber(data?.ggr),
        recentLogs: Array.isArray(data?.recentLogs) ? data.recentLogs : [],
        roomStats: normalizeRoomStats(data?.roomStats),
      });

      setStatusText("Room telemetry synchronized.");
    } catch (error) {
      console.error("Dashboard stats failed:", error);
      setStatusText("Dashboard sync failed. Backend telemetry needs review.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadWallet = useCallback(async () => {
    if (!userId) return;

    try {
      setWalletLoading(true);

      const data = await getWallet(userId);

      setWallet({
        playable_balance: toNumber(data?.playable_balance),
        locked_vault: toNumber(data?.locked_vault),
      });
    } catch (error) {
      console.error("Wallet preview sync failed:", error);
      setStatusText("Wallet preview sync failed.");
    } finally {
      setWalletLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    void loadDashboard();
    void loadWallet();
  }, [userId, loadDashboard, loadWallet]);

  async function handleRefresh() {
    await Promise.all([loadDashboard(), loadWallet()]);
  }

  async function handleFundWallet() {
    if (!userId || funding) return;

    try {
      setFunding(true);
      setWalletLoading(true);
      setStatusText("LiveOps command running: crediting $5,000...");

      const success = await fundWallet(userId, 5000);

      if (!success) {
        setStatusText("LiveOps credit failed. Backend RPC needs review.");
        return;
      }

      await Promise.all([loadWallet(), loadDashboard()]);

      setStatusText("LiveOps credit complete. Wallet refreshed.");
    } catch (error) {
      console.error("Fund wallet failed:", error);
      setStatusText("LiveOps credit failed.");
    } finally {
      setFunding(false);
      setWalletLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUserId(null);
    router.replace("/auth");
  }

  const kpis = useMemo(
    () => [
      {
        label: "Total Spins",
        value: formatNumber(stats?.totalSpins ?? 0),
        note: "Recorded game events",
        icon: Activity,
      },
      {
        label: "Total Turnover",
        value: formatMoney(stats?.totalTurnover ?? 0),
        note: "Virtual bet volume",
        icon: BarChart3,
      },
      {
        label: "Total GGR",
        value: formatMoney(stats?.ggr ?? 0),
        note: "Turnover minus wins",
        icon: Coins,
      },
    ],
    [stats]
  );

  const roomRows = useMemo(() => {
    const roomStats = stats?.roomStats ?? EMPTY_ROOM_STATS;

    return ROOM_ORDER.map((roomName) => {
      const room = roomStats[roomName];
      const margin =
        room.turnover > 0 ? (room.ggr / room.turnover) * 100 : 0;

      return {
        roomName,
        ...room,
        margin,
      };
    });
  }, [stats]);

  const recentLogs = stats?.recentLogs ?? [];

  return (
    <main className="min-h-dvh overflow-hidden bg-[#050505] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-[-18rem] h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-[#8B0000]/35 blur-[150px]" />
        <div className="absolute bottom-[-18rem] right-[-12rem] h-[34rem] w-[34rem] rounded-full bg-[#FFD700]/10 blur-[140px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:36px_36px] opacity-35" />
      </div>

      <section className="relative mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-5 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.58)] backdrop-blur-xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Link
                  href="/lobby"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-white/50 transition hover:border-[#FFD700]/30 hover:text-[#FFD700]"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Lobby
                </Link>

                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-white/50 transition hover:border-[#FFD700]/30 hover:text-[#FFD700]"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Simulation
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-white/50 transition hover:border-red-400/30 hover:text-red-200"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </button>
              </div>

              <div className="flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-[0.28em] text-[#FFD700]/70">
                <Terminal className="h-3.5 w-3.5" />
                Operator Dark Mode
              </div>

              <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-white sm:text-5xl">
                Nagani Operator Console
              </h1>

              <p className="mt-3 max-w-3xl font-mono text-xs leading-6 text-white/45 sm:text-sm">
                Telemetry view for PM interview: total casino activity,
                volatility-room performance, GGR breakdown, and LiveOps wallet
                injection demo.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:w-[25rem]">
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4">
                <div className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200/70">
                  Playable
                </div>
                <div className="mt-2 font-mono text-2xl font-black text-emerald-200">
                  {walletLoading
                    ? "..."
                    : formatMoney(wallet?.playable_balance ?? 0)}
                </div>
              </div>

              <div className="rounded-2xl border border-[#FFD700]/20 bg-[#FFD700]/[0.06] p-4">
                <div className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-[#FFD700]/70">
                  Vault
                </div>
                <div className="mt-2 font-mono text-2xl font-black text-[#FFD700]">
                  {walletLoading
                    ? "..."
                    : formatMoney(wallet?.locked_vault ?? 0)}
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {kpis.map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06, duration: 0.42 }}
                className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl backdrop-blur-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="rounded-2xl border border-[#FFD700]/20 bg-[#FFD700]/10 p-3">
                    <Icon className="h-5 w-5 text-[#FFD700]" />
                  </div>

                  <div className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-white/30">
                    KPI
                  </div>
                </div>

                <div className="mt-5 font-mono text-3xl font-black tracking-tight text-white">
                  {loading ? "—" : item.value}
                </div>

                <div className="mt-2 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#FFD700]/75">
                  {item.label}
                </div>

                <p className="mt-2 text-xs leading-5 text-white/40">
                  {item.note}
                </p>
              </motion.div>
            );
          })}
        </section>

        <section className="mt-5 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.52)] backdrop-blur-xl">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-[0.24em] text-[#FFD700]/70">
                <Layers3 className="h-4 w-4" />
                Volatility Room Stats
              </div>

              <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
                GGR Breakdown by Room
              </h2>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading || walletLoading || !userId}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-4 py-2 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-white/50 transition hover:border-[#FFD700]/30 hover:text-[#FFD700] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading || walletLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCcw className="h-3.5 w-3.5" />
              )}
              Refresh
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {roomRows.map((room, index) => {
              const visual = getRoomVisual(room.roomName);

              return (
                <motion.div
                  key={room.roomName}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + index * 0.06, duration: 0.42 }}
                  className={`rounded-[1.5rem] border ${visual.border} ${visual.bg} ${visual.glow} p-4`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div
                        className={`font-mono text-[10px] font-black uppercase tracking-[0.22em] ${visual.text}`}
                      >
                        {visual.tag}
                      </div>
                      <h3 className="mt-2 text-xl font-black text-white">
                        {room.roomName}
                      </h3>
                    </div>

                    <div className="rounded-full border border-white/10 bg-black/25 px-3 py-1 font-mono text-[9px] font-black uppercase tracking-[0.18em] text-white/35">
                      Room
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                      <div className="font-mono text-[9px] font-black uppercase tracking-[0.18em] text-white/30">
                        Spins
                      </div>
                      <div className="mt-1 font-mono text-xl font-black text-white">
                        {loading ? "—" : formatNumber(room.spins)}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                      <div className="font-mono text-[9px] font-black uppercase tracking-[0.18em] text-white/30">
                        Margin
                      </div>
                      <div className={`mt-1 font-mono text-xl font-black ${visual.text}`}>
                        {loading ? "—" : formatPercent(room.margin)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2 rounded-2xl border border-white/10 bg-black/25 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
                        Turnover
                      </span>
                      <span className="font-mono text-sm font-black text-white">
                        {loading ? "—" : formatMoney(room.turnover)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
                        Wins Paid
                      </span>
                      <span className="font-mono text-sm font-black text-red-200">
                        {loading ? "—" : formatMoney(room.wins)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-2">
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
                        GGR
                      </span>
                      <span className={`font-mono text-base font-black ${visual.text}`}>
                        {loading ? "—" : formatMoney(room.ggr)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.42 }}
            className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.5)] backdrop-blur-xl"
          >
            <div className="flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-[0.24em] text-[#FFD700]/70">
              <WalletCards className="h-4 w-4" />
              LiveOps Control
            </div>

            <h2 className="mt-2 text-2xl font-black text-white">
              VIP Wallet Injection
            </h2>

            <p className="mt-3 text-sm leading-6 text-white/45">
              Demo button for operator-side account crediting. This proves the
              product has a LiveOps layer, not only a player-facing slot screen.
            </p>

            <motion.button
              type="button"
              onClick={handleFundWallet}
              disabled={funding || authLoading || !userId}
              whileTap={{
                scale: funding || authLoading || !userId ? 1 : 0.96,
              }}
              className="mt-5 flex w-full items-center justify-center gap-3 rounded-[1.35rem] border border-emerald-400/25 bg-emerald-400/10 px-5 py-4 font-black uppercase tracking-[0.18em] text-emerald-200 shadow-[0_0_28px_rgba(74,222,128,0.08)] transition hover:border-emerald-300/40 hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {funding ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Coins className="h-5 w-5" />
              )}
              {funding ? "Crediting Account" : "Credit Account ($5,000)"}
            </motion.button>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
              <div className="flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                <ShieldCheck className="h-3.5 w-3.5 text-[#FFD700]" />
                Status
              </div>
              <p className="mt-2 text-xs leading-5 text-white/45">
                {statusText}
              </p>
            </div>

            <div className="mt-4 rounded-2xl border border-[#FFD700]/20 bg-[#FFD700]/[0.05] p-4">
              <div className="flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#FFD700]/75">
                <TrendingUp className="h-4 w-4" />
                PM Talking Point
              </div>

              <p className="mt-3 text-sm leading-6 text-white/50">
                The operator can compare room risk profiles in real time, then
                use LiveOps wallet crediting to demonstrate retention, VIP
                handling, and balance control during the product walkthrough.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.42 }}
            className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.5)] backdrop-blur-xl"
          >
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-[0.24em] text-[#FFD700]/70">
                  <Database className="h-3.5 w-3.5" />
                  Live Spin Ledger
                </div>

                <h2 className="mt-2 text-2xl font-black text-white">
                  Recent Telemetry
                </h2>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
                <Gauge className="h-3.5 w-3.5 text-[#FFD700]" />
                {recentLogs.length} Rows
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left">
                  <thead className="bg-white/[0.06]">
                    <tr className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Room</th>
                      <th className="px-4 py-3">Bet</th>
                      <th className="px-4 py-3">Win</th>
                      <th className="px-4 py-3">Near-Miss</th>
                      <th className="px-4 py-3">Result</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading && (
                      <tr className="border-t border-white/10 bg-black/20">
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-sm text-white/45"
                        >
                          Loading room telemetry...
                        </td>
                      </tr>
                    )}

                    {!loading && recentLogs.length === 0 && (
                      <tr className="border-t border-white/10 bg-black/20">
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-sm text-white/45"
                        >
                          No telemetry yet. Run spins from the player page.
                        </td>
                      </tr>
                    )}

                    {!loading &&
                      recentLogs.map((log, index) => {
                        const bet = toNumber(log.bet_amount);
                        const win = toNumber(log.win_amount);
                        const nearMiss = Boolean(log.is_near_miss);
                        const isWin = win > 0;

                        return (
                          <tr
                            key={`${log.created_at}-${index}`}
                            className="border-t border-white/10 bg-black/20 text-sm text-white/65 transition hover:bg-white/[0.035]"
                          >
                            <td className="px-4 py-4 font-mono text-white/55">
                              {getTime(log)}
                            </td>

                            <td className="px-4 py-4 font-mono text-white/70">
                              {log.room_name || "—"}
                            </td>

                            <td className="px-4 py-4 font-mono text-white">
                              {formatMoney(bet)}
                            </td>

                            <td
                              className={`px-4 py-4 font-mono font-black ${
                                isWin ? "text-emerald-300" : "text-red-300"
                              }`}
                            >
                              {formatMoney(win)}
                            </td>

                            <td className="px-4 py-4">
                              <span
                                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${
                                  nearMiss
                                    ? "border-[#FFD700]/25 bg-[#FFD700]/10 text-[#FFD700]"
                                    : "border-white/10 bg-white/[0.055] text-white/45"
                                }`}
                              >
                                {nearMiss && <Flame className="h-3 w-3" />}
                                {nearMiss ? "Yes" : "No"}
                              </span>
                            </td>

                            <td className="px-4 py-4">
                              <span
                                className={`rounded-full border px-3 py-1 text-xs font-bold ${
                                  isWin
                                    ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
                                    : nearMiss
                                      ? "border-[#FFD700]/25 bg-[#FFD700]/10 text-[#FFD700]"
                                      : "border-red-400/20 bg-red-400/10 text-red-200"
                                }`}
                              >
                                {isWin ? "Win" : nearMiss ? "Near Miss" : "Loss"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </section>
      </section>
    </main>
  );
}