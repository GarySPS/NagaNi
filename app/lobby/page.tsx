//app>lobby>page.tsx

"use client";

import { getWallet } from "@/app/lib/actions";
import { supabase } from "@/app/lib/supabase";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Coins,
  Flame,
  Gem,
  Leaf,
  Loader2,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Vault,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type RoomName = "Green Valley" | "Golden Buffalo" | "Dragon's Peak";

type VolatilityRoom = {
  id: RoomName;
  name: RoomName;
  volatility: "Low" | "Medium" | "High";
  multiplier: string;
};

type WalletState = {
  playable_balance: number | string | null;
  locked_vault: number | string | null;
};

const VOLATILITY_ROOMS: VolatilityRoom[] = [
  {
    id: "Green Valley",
    name: "Green Valley",
    volatility: "Low",
    multiplier: "Up to 50x",
  },
  {
    id: "Golden Buffalo",
    name: "Golden Buffalo",
    volatility: "Medium",
    multiplier: "Up to 250x",
  },
  {
    id: "Dragon's Peak",
    name: "Dragon's Peak",
    volatility: "High",
    multiplier: "Up to 1000x+",
  },
];

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCredits(value: number | string | null | undefined) {
  return `$${toNumber(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getRoomVisual(roomName: RoomName) {
  if (roomName === "Green Valley") {
    return {
      icon: Leaf,
      eyebrow: "Beginner Room",
      description: "Soft rhythm, calmer wins, emerald entry chamber.",
      border: "border-emerald-300/20",
      bg: "from-emerald-400/18 via-emerald-500/[0.05] to-white/[0.03]",
      glow: "shadow-[0_0_44px_rgba(16,185,129,0.12)]",
      iconBox: "border-emerald-300/25 bg-emerald-400/12 text-emerald-100",
      pill: "border-emerald-300/20 bg-emerald-400/10 text-emerald-100",
      button:
        "border-emerald-300/25 bg-emerald-400/12 text-emerald-50 active:bg-emerald-400/20",
    };
  }

  if (roomName === "Golden Buffalo") {
    return {
      icon: Gem,
      eyebrow: "Classic Hall",
      description: "Familiar casino flow with medium volatility.",
      border: "border-yellow-300/20",
      bg: "from-yellow-400/18 via-yellow-500/[0.05] to-white/[0.03]",
      glow: "shadow-[0_0_44px_rgba(234,179,8,0.12)]",
      iconBox: "border-yellow-300/25 bg-yellow-400/12 text-yellow-100",
      pill: "border-yellow-300/20 bg-yellow-400/10 text-yellow-100",
      button:
        "border-yellow-300/25 bg-yellow-400/12 text-yellow-50 active:bg-yellow-400/20",
    };
  }

  return {
    icon: Flame,
    eyebrow: "High Roller Peak",
    description: "Red dragon fire room. Highest risk, biggest spectacle.",
    border: "border-red-300/25",
    bg: "from-red-500/24 via-yellow-500/[0.07] to-white/[0.03]",
    glow: "shadow-[0_0_58px_rgba(239,68,68,0.2)]",
    iconBox: "border-red-300/25 bg-red-500/16 text-yellow-100",
    pill: "border-red-300/25 bg-red-500/12 text-red-50",
    button:
      "border-yellow-300/30 bg-gradient-to-r from-red-500/24 via-yellow-400/16 to-red-500/24 text-yellow-50 active:scale-[0.98]",
  };
}

export default function LobbyPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [userLabel, setUserLabel] = useState("Player");
  const [selectedRoom, setSelectedRoom] = useState<RoomName | null>(null);
  const [errorText, setErrorText] = useState("");

  const totalCredits = useMemo(() => {
    return toNumber(wallet?.playable_balance) + toNumber(wallet?.locked_vault);
  }, [wallet]);

  useEffect(() => {
    let mounted = true;

    async function bootLobby() {
      setLoading(true);
      setErrorText("");

      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        router.replace("/auth");
        return;
      }

      try {
        const nextWallet = await getWallet(data.user.id);

        if (!mounted) return;

        setWallet({
          playable_balance: nextWallet?.playable_balance ?? 0,
          locked_vault: nextWallet?.locked_vault ?? 0,
        });

        setUserLabel(data.user.email?.split("@")[0] || "Player");
      } catch (walletError) {
        console.error(walletError);

        if (!mounted) return;

        setErrorText("Wallet sync failed. Please refresh.");
        setWallet({
          playable_balance: 0,
          locked_vault: 0,
        });
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void bootLobby();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.replace("/auth");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  async function refreshWallet() {
    setRefreshing(true);
    setErrorText("");

    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      router.replace("/auth");
      return;
    }

    try {
      const nextWallet = await getWallet(data.user.id);

      setWallet({
        playable_balance: nextWallet?.playable_balance ?? 0,
        locked_vault: nextWallet?.locked_vault ?? 0,
      });
    } catch (walletError) {
      console.error(walletError);
      setErrorText("Wallet refresh failed.");
    } finally {
      setRefreshing(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/auth");
  }

  function enterRoom(roomName: RoomName) {
    setSelectedRoom(roomName);
    router.push(`/?room=${encodeURIComponent(roomName)}`);
  }

  if (loading) {
    return (
      <main className="min-h-dvh bg-[#050505] text-white">
        <div className="mx-auto flex min-h-dvh w-full max-w-md items-center justify-center px-5">
          <div className="w-full rounded-[2rem] border border-[#FFD700]/20 bg-white/[0.05] p-8 text-center shadow-[0_0_80px_rgba(255,215,0,0.08)] backdrop-blur-xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#FFD700]/20 bg-[#FFD700]/10">
              <Loader2 className="h-5 w-5 animate-spin text-[#FFD700]" />
            </div>

            <p className="font-mono text-[10px] font-black uppercase tracking-[0.28em] text-[#FFD700]/70">
              Opening Lobby
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
    <main className="min-h-dvh overflow-hidden bg-[#050505] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-[-10rem] h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-[#8B0000]/45 blur-[120px]" />
        <div className="absolute bottom-[-14rem] right-[-10rem] h-[26rem] w-[26rem] rounded-full bg-[#FFD700]/10 blur-[120px]" />
        <div className="absolute bottom-[10rem] left-[-12rem] h-[22rem] w-[22rem] rounded-full bg-emerald-400/10 blur-[110px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:44px_44px] opacity-40" />
      </div>

      <section className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 py-5">
        <header className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-[0.24em] text-[#FFD700]/70">
                <ShieldCheck className="h-3.5 w-3.5" />
                Project Nagani
              </div>

              <h1 className="mt-1 bg-gradient-to-r from-white via-[#FFD700] to-[#8B0000] bg-clip-text text-4xl font-black tracking-tight text-transparent">
                Lobby
              </h1>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-white/10 bg-white/[0.055] px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.12em] text-white/45 backdrop-blur-xl transition active:scale-95"
            >
              <span className="flex items-center gap-1">
                <LogOut className="h-3.5 w-3.5" />
                Exit
              </span>
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-[1.5rem] border border-[#FFD700]/20 bg-[#FFD700]/[0.07] p-4">
              <div className="flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#FFD700]/70">
                <Coins className="h-3.5 w-3.5" />
                Credits
              </div>

              <div className="mt-2 font-mono text-xl font-black text-white">
                {formatCredits(wallet?.playable_balance)}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-red-300/20 bg-red-500/[0.08] p-4">
              <div className="flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-red-100/70">
                <Vault className="h-3.5 w-3.5" />
                Vault
              </div>

              <div className="mt-2 font-mono text-xl font-black text-red-50">
                {formatCredits(wallet?.locked_vault)}
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between rounded-[1.25rem] border border-white/10 bg-black/25 px-4 py-3">
            <div>
              <div className="font-mono text-[9px] font-black uppercase tracking-[0.2em] text-white/35">
                Player
              </div>
              <div className="mt-1 max-w-[11rem] truncate text-sm font-bold text-white/80">
                {userLabel}
              </div>
            </div>

            <button
              type="button"
              onClick={refreshWallet}
              disabled={refreshing}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.055] text-white/50 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
            </button>
          </div>

          {errorText && (
            <div className="mt-3 rounded-[1.25rem] border border-red-300/25 bg-red-500/10 px-4 py-3 text-xs font-semibold text-red-100">
              {errorText}
            </div>
          )}
        </header>

        <section className="mt-5">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#FFD700]/20 bg-[#FFD700]/10 px-3 py-1.5 font-mono text-[9px] font-black uppercase tracking-[0.22em] text-[#FFD700]/80">
                <Sparkles className="h-3 w-3" />
                Rooms Live
              </div>

              <h2 className="mt-3 text-2xl font-black tracking-tight">
                Choose Chamber
              </h2>

              <p className="mt-1 text-xs leading-5 text-white/45">
                Each room has its own volatility profile.
              </p>
            </div>

            <div className="text-right">
              <div className="font-mono text-[9px] font-black uppercase tracking-[0.18em] text-white/35">
                Total
              </div>
              <div className="font-mono text-lg font-black text-[#FFD700]">
                {formatCredits(totalCredits)}
              </div>
            </div>
          </div>

          <div className="space-y-3 pb-6">
            {VOLATILITY_ROOMS.map((room, index) => {
              const visual = getRoomVisual(room.name);
              const Icon = visual.icon;
              const isSelected = selectedRoom === room.name;

              return (
                <motion.article
                  key={room.id}
                  initial={{ opacity: 0, y: 18, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    delay: index * 0.06,
                    type: "spring",
                    stiffness: 150,
                    damping: 18,
                  }}
                  whileTap={{ scale: 0.985 }}
                  className={`relative overflow-hidden rounded-[2rem] border ${visual.border} bg-gradient-to-br ${visual.bg} p-4 backdrop-blur-xl ${visual.glow}`}
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />

                  {room.name === "Dragon's Peak" && (
                    <div className="absolute right-4 top-4 rounded-full border border-[#FFD700]/20 bg-[#FFD700]/10 px-2.5 py-1 font-mono text-[8px] font-black uppercase tracking-[0.18em] text-[#FFD700]">
                      Flagship
                    </div>
                  )}

                  <div className="flex gap-4">
                    <div
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${visual.iconBox}`}
                    >
                      <Icon className="h-7 w-7" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-[9px] font-black uppercase tracking-[0.22em] text-white/35">
                        {visual.eyebrow}
                      </div>

                      <h3 className="mt-1 text-2xl font-black tracking-tight">
                        {room.name}
                      </h3>

                      <p className="mt-2 text-xs leading-5 text-white/50">
                        {visual.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className={`rounded-2xl border px-3 py-3 ${visual.pill}`}>
                      <div className="font-mono text-[8px] font-black uppercase tracking-[0.18em] opacity-60">
                        Volatility
                      </div>
                      <div className="mt-1 text-sm font-black">
                        {room.volatility}
                      </div>
                    </div>

                    <div className={`rounded-2xl border px-3 py-3 ${visual.pill}`}>
                      <div className="font-mono text-[8px] font-black uppercase tracking-[0.18em] opacity-60">
                        Multiplier
                      </div>
                      <div className="mt-1 text-sm font-black">
                        {room.multiplier}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => enterRoom(room.name)}
                    disabled={isSelected}
                    className={`mt-4 flex w-full items-center justify-between rounded-[1.35rem] border px-4 py-3.5 text-sm font-black transition disabled:opacity-70 ${visual.button}`}
                  >
                    <span>{isSelected ? "Entering..." : "Play Now"}</span>

                    {isSelected ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                </motion.article>
              );
            })}
          </div>
        </section>

        <div className="mt-auto pb-2 text-center font-mono text-[9px] font-black uppercase tracking-[0.22em] text-white/25">
          Production Lobby · Volatility Engine Active
        </div>
      </section>
    </main>
  );
}