//app>_backup>NaganiPageV3Backup.tsx

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { getWallet, playSpin } from "../lib/actions";
import { useRouter, useSearchParams } from "next/navigation";
import LiveWinnerFeed from "../components/nagani/LiveWinnerFeed";
import { supabase } from "../lib/supabase";
import {
  AlertTriangle,
  Clock3,
  Coins,
  Flame,
  Home,
  Trophy,
  UserCircle,
  Vault,
} from "lucide-react";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import DragonSlotBoard from "../components/nagani/DragonSlotBoard";
import type { ReelSymbolKey } from "../components/nagani/SlotReel";

type SpinPayload = {
  isWin: boolean;
  payout: number;
  isNearMiss: boolean;
  finalReels: ReelSymbolKey[];
};

const BET_AMOUNT = 25;

type RoomName = "Green Valley" | "Golden Buffalo" | "Dragon's Peak";

function resolveRoomName(value: string | null): RoomName {
  if (
    value === "Green Valley" ||
    value === "Golden Buffalo" ||
    value === "Dragon's Peak"
  ) {
    return value;
  }

  return "Golden Buffalo";
}

function getRoomSkin(roomName: RoomName) {
  if (roomName === "Green Valley") {
    return {
      label: "Green Valley",
      subtitle: "Calm Entry Room",
      mood: "Low volatility · steady rhythm",
      icon: "🍃",
      border: "border-emerald-300/25",
      glow: "shadow-[0_0_44px_rgba(16,185,129,0.12)]",
      frame: "from-emerald-400/18 via-white/[0.035] to-black/65",
      badge: "border-emerald-300/25 bg-emerald-400/10 text-emerald-100",
    };
  }

  if (roomName === "Golden Buffalo") {
    return {
      label: "Golden Buffalo",
      subtitle: "Classic Gold Room",
      mood: "Medium volatility · familiar casino flow",
      icon: "🦬",
      border: "border-[#FFD700]/25",
      glow: "shadow-[0_0_44px_rgba(255,215,0,0.13)]",
      frame: "from-[#FFD700]/18 via-white/[0.035] to-black/65",
      badge: "border-[#FFD700]/25 bg-[#FFD700]/10 text-[#FFD700]",
    };
  }

  return {
    label: "Dragon's Peak",
    subtitle: "Red Dragon Room",
    mood: "High volatility · fire reel experience",
    icon: "🐉",
    border: "border-red-300/25",
    glow: "shadow-[0_0_58px_rgba(239,68,68,0.2)]",
    frame: "from-red-500/24 via-[#FFD700]/10 to-black/70",
    badge: "border-[#FFD700]/30 bg-[#FFD700]/10 text-[#FFD700]",
  };
}

function formatCredits(value: number) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function GoldRain({ active }: { active: boolean }) {
  const particles = useMemo(
    () =>
      Array.from({ length: 48 }, (_, index) => ({
        id: index,
        left: `${Math.random() * 100}%`,
        delay: Math.random() * 0.7,
        duration: 1.2 + Math.random() * 1.5,
        size: 4 + Math.random() * 8,
      })),
    [active]
  );

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
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

export default function NaganiPageBackup() {
  return (
    <Suspense fallback={<NaganiPageLoading />}>
      <NaganiGame />
    </Suspense>
  );
}

function NaganiPageLoading() {
  return (
    <main className="nagani-page flex items-center justify-center px-6 text-white">
      <div className="rounded-[2rem] border border-[#FFD700]/20 bg-white/[0.05] p-8 text-center shadow-[0_0_80px_rgba(255,215,0,0.08)] backdrop-blur-xl">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[#FFD700]/30 border-t-[#FFD700]" />
        <div className="font-mono text-[10px] font-black uppercase tracking-[0.24em] text-[#FFD700]/70">
          Loading Nagani
        </div>
      </div>
    </main>
  );
}

function NaganiGame() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedRoom = resolveRoomName(searchParams.get("room"));
  const roomSkin = getRoomSkin(selectedRoom);

  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [credits, setCredits] = useState(0);
  const [lockedVault, setLockedVault] = useState(0);
  const [walletLoading, setWalletLoading] = useState(true);
  const [vaultSeconds, setVaultSeconds] = useState(89);
  const [spinKey, setSpinKey] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [stoppedReels, setStoppedReels] = useState(0);
  const [finalReels, setFinalReels] = useState<ReelSymbolKey[]>([
    "dragon",
    "gold",
    "coin",
  ]);
  const [lastResult, setLastResult] = useState<SpinPayload | null>(null);
  const [pendingResult, setPendingResult] = useState<SpinPayload | null>(null);
  const [showGoldRain, setShowGoldRain] = useState(false);

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

  const syncWallet = useCallback(async () => {
    if (!userId) return;

    try {
      setWalletLoading(true);

      const wallet = await getWallet(userId);

      setCredits(Number(wallet?.playable_balance ?? 0));
      setLockedVault(Number(wallet?.locked_vault ?? 0));
    } catch {
      setCredits(0);
      setLockedVault(0);
    } finally {
      setWalletLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    void syncWallet();
  }, [userId, syncWallet]);

  const minutes = Math.floor(vaultSeconds / 60);
  const seconds = vaultSeconds % 60;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setVaultSeconds((current) => (current <= 0 ? 89 : current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isSpinning || stoppedReels < 3 || !pendingResult) return;

    setIsSpinning(false);
    setLastResult(pendingResult);
    void syncWallet();

    if (pendingResult.isWin) {
      setShowGoldRain(true);
      window.setTimeout(() => setShowGoldRain(false), 2400);
    }
  }, [stoppedReels, isSpinning, pendingResult, syncWallet]);

  async function handleSpin() {
    if (
      authLoading ||
      walletLoading ||
      !userId ||
      isSpinning ||
      credits < BET_AMOUNT
    ) {
      return;
    }

    try {
      setShowGoldRain(false);
      setLastResult(null);
      setPendingResult(null);
      setStoppedReels(0);
      setIsSpinning(true);

      const result = await playSpin(userId, BET_AMOUNT, selectedRoom);

      const mappedResult: SpinPayload = {
        isWin: Boolean(result.isWin),
        payout: Number(result.payout || 0),
        isNearMiss: Boolean(result.isNearMiss),
        finalReels: result.finalReels.map((symbol) =>
          String(symbol).toLowerCase()
        ) as ReelSymbolKey[],
      };

      setPendingResult(mappedResult);
      setFinalReels(mappedResult.finalReels);
      setCredits((current) => current - BET_AMOUNT);
      setSpinKey((current) => current + 1);
    } catch {
      setIsSpinning(false);
      setPendingResult(null);
      setLastResult({
        isWin: false,
        payout: 0,
        isNearMiss: false,
        finalReels,
      });

      void syncWallet();
    }
  }

  function handleReelStop() {
    setStoppedReels((current) => current + 1);
  }

  const canSpin =
    !authLoading &&
    !walletLoading &&
    !!userId &&
    !isSpinning &&
    credits >= BET_AMOUNT;

  const spinButtonText = authLoading
    ? "Checking"
    : walletLoading
      ? "Syncing"
      : credits < BET_AMOUNT
        ? "Add Credits"
        : isSpinning
          ? "Spinning"
          : "Spin";

  const resultLabel = isSpinning
    ? pendingResult?.isNearMiss
      ? "Final Reel Hold"
      : "Spinning..."
    : lastResult?.isWin
      ? "Dragon Win!"
      : lastResult?.isNearMiss
        ? "Almost!"
        : lastResult
          ? "Try Again"
          : "Good Luck";

  return (
    <main className="nagani-page text-white">
      <GoldRain active={showGoldRain} />
      <LiveWinnerFeed />

      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-[-12rem] h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-nagani-dragon-red/50 blur-[120px]" />
        <div className="absolute bottom-[-16rem] right-[-12rem] h-[32rem] w-[32rem] rounded-full bg-nagani-gold/10 blur-[120px]" />
        <div className="nagani-grid-overlay absolute inset-0 opacity-40" />
      </div>

      <section className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col px-3 pb-4 pt-3">
        <header className="mb-3 rounded-[1.75rem] border border-nagani-gold/15 bg-[#120304]/78 p-2.5 shadow-[0_18px_60px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => router.push("/lobby")}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.055] text-white/55 active:scale-95"
              aria-label="Back to lobby"
            >
              <Home className="h-5 w-5" />
            </button>

            <div className="min-w-0 flex-1 text-center">
              <div className="flex items-center justify-center gap-2 font-mono text-[9px] font-black uppercase tracking-[0.24em] text-nagani-gold/75">
                <Flame className="h-3 w-3" />
                Red Dragon Casino
              </div>

              <h1 className="mt-0.5 truncate bg-gradient-to-r from-white via-nagani-gold to-red-500 bg-clip-text text-[1.65rem] font-black leading-none tracking-tight text-transparent">
                NAGANI
              </h1>
            </div>

            <button
              type="button"
              onClick={() => router.push("/profile")}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.055] text-white/55 active:scale-95"
              aria-label="Open profile"
            >
              <UserCircle className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-2 grid grid-cols-[1fr_auto] gap-2 rounded-[1.35rem] border border-white/10 bg-black/30 p-2.5">
            <div className="min-w-0">
              <div className="font-mono text-[8px] font-black uppercase tracking-[0.22em] text-white/35">
                Playing Room
              </div>

              <div className="mt-1 truncate text-lg font-black leading-none text-white">
                {roomSkin.label}
              </div>

              <div className="mt-1 truncate text-[11px] font-semibold text-white/45">
                {roomSkin.mood}
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push("/cashier")}
              className="rounded-[1.2rem] border border-nagani-gold/25 bg-nagani-gold/10 px-3 py-2 text-right active:scale-[0.98]"
            >
              <div className="font-mono text-[8px] font-black uppercase tracking-[0.16em] text-nagani-gold/70">
                Cashier
              </div>

              <div className="mt-1 font-mono text-sm font-black text-nagani-gold">
                {walletLoading ? "..." : formatCredits(credits)}
              </div>
            </button>
          </div>
        </header>

        <section className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => router.push("/cashier")}
            className="rounded-[1rem] border border-white/10 bg-black/35 px-2.5 py-2 text-left active:scale-[0.98]"
          >
            <div className="flex items-center gap-1.5 font-mono text-[7px] font-black uppercase tracking-[0.16em] text-white/35">
              <Coins className="h-3 w-3 text-nagani-gold" />
              Credits
            </div>

            <div className="mt-1 truncate font-mono text-sm font-black text-white">
              {walletLoading ? "..." : formatCredits(credits)}
            </div>
          </button>

          <div className="rounded-[1rem] border border-nagani-gold/20 bg-nagani-gold/[0.07] px-2.5 py-2">
            <div className="flex items-center gap-1.5 font-mono text-[7px] font-black uppercase tracking-[0.16em] text-nagani-gold/70">
              <Vault className="h-3 w-3" />
              Vault
            </div>

            <div className="mt-1 truncate font-mono text-sm font-black text-nagani-gold">
              {walletLoading ? "..." : formatCredits(lockedVault)}
            </div>
          </div>

          <div className="rounded-[1rem] border border-white/10 bg-black/35 px-2.5 py-2 text-right">
            <div className="font-mono text-[7px] font-black uppercase tracking-[0.16em] text-white/35">
              Bet
            </div>

            <div className="mt-1 font-mono text-sm font-black text-white">
              {formatCredits(BET_AMOUNT)}
            </div>
          </div>
        </section>

        <section
          className={`nagani-cabinet mt-3 rounded-[2rem] border ${roomSkin.border} p-3 ${roomSkin.glow}`}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <div
              className={`inline-flex rounded-full border px-3 py-1 font-mono text-[8px] font-black uppercase tracking-[0.16em] ${roomSkin.badge}`}
            >
              {selectedRoom}
            </div>

            <div className="rounded-full border border-nagani-gold/20 bg-black/30 px-3 py-1 font-mono text-[8px] font-black uppercase tracking-[0.16em] text-nagani-gold/70">
              Reel Cabinet
            </div>
          </div>

          <DragonSlotBoard
            finalReels={finalReels}
            isSpinning={isSpinning}
            isNearMiss={pendingResult?.isNearMiss}
            spinKey={spinKey}
            onStop={handleReelStop}
          />

          <div className="mt-3 rounded-[1.5rem] border border-white/10 bg-black/35 p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-white/35">
                  Result
                </div>

                <div className="mt-1 text-xl font-black text-white">
                  {resultLabel}
                </div>
              </div>

              <div className="text-right">
                <div className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
                  Win
                </div>

                <div className="mt-1 font-mono text-2xl font-black text-[#FFD700]">
                  {formatCredits(lastResult?.payout ?? 0)}
                </div>
              </div>
            </div>

            {pendingResult?.isNearMiss && isSpinning && (
              <motion.div
                className="mt-3 flex items-center gap-2 rounded-2xl border border-[#FFD700]/25 bg-[#FFD700]/10 px-3 py-2 text-xs font-bold text-[#FFD700]"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Flame className="h-4 w-4" />
                Final reel is holding...
              </motion.div>
            )}
          </div>
        </section>

        {!walletLoading && credits < BET_AMOUNT && (
          <div className="mt-3 rounded-[1.25rem] border border-[#FFD700]/20 bg-[#FFD700]/[0.06] px-4 py-3 backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#FFD700]" />

              <div>
                <div className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#FFD700]/80">
                  Add Credits
                </div>

                <p className="mt-1 text-xs leading-5 text-white/45">
                  Your balance is too low for the next spin. Open Cashier to
                  request more credits.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="pt-2">
          <motion.button
            type="button"
            onClick={handleSpin}
            aria-disabled={!canSpin}
            whileTap={{ scale: canSpin ? 0.94 : 1 }}
            animate={{
              boxShadow: isSpinning
                ? "0 0 18px rgba(255,215,0,0.18)"
                : [
                    "0 0 22px rgba(255,215,0,0.28)",
                    "0 0 54px rgba(255,215,0,0.56)",
                    "0 0 22px rgba(255,215,0,0.28)",
                  ],
            }}
            transition={{
              duration: 1.8,
              repeat: isSpinning ? 0 : Infinity,
            }}
            className={`nagani-gold-button group relative w-full overflow-hidden rounded-[1.75rem] px-6 py-4 text-center font-black uppercase tracking-[0.28em] transition ${
              !canSpin ? "cursor-not-allowed opacity-60" : "cursor-pointer"
            }`}
          >
            <span className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/55 to-transparent transition-transform duration-700 group-hover:translate-x-[120%]" />

            <span className="relative flex items-center justify-center gap-3">
              {spinButtonText}
              <Trophy className="h-5 w-5" />
            </span>
          </motion.button>
        </div>
      </section>
    </main>
  );
}