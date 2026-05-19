"use client";

import { AnimatePresence, motion } from "framer-motion";
import { getWallet, playSpin } from "./lib/actions";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import LiveWinnerFeed from "./components/nagani/LiveWinnerFeed";
import { supabase } from "./lib/supabase";
import {
  AlertTriangle,
  Clock3,
  Coins,
  Flame,
  Gem,
  LogOut,
  ShieldCheck,
  Sparkles,
  Trophy,
  Vault,
} from "lucide-react";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import SlotReel, { ReelSymbolKey } from "./components/nagani/SlotReel";

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

export default function NaganiPage() {
  return (
    <Suspense fallback={<NaganiPageLoading />}>
      <NaganiGame />
    </Suspense>
  );
}

function NaganiPageLoading() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#050505] px-6 text-white">
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
  } catch (error) {
    console.error("Wallet sync failed:", error);
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
  if (authLoading || walletLoading || !userId || isSpinning || credits < BET_AMOUNT) {
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
  } catch (error) {
    console.error("Spin failed:", error);
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

async function handleLogout() {
  await supabase.auth.signOut();
  setUserId(null);
  router.replace("/auth");
}

  function handleReelStop() {
    setStoppedReels((current) => current + 1);
  }

  const canSpin =
  !authLoading && !walletLoading && !!userId && !isSpinning && credits >= BET_AMOUNT;

const spinButtonText = authLoading
  ? "Checking Session"
  : walletLoading
    ? "Syncing Wallet"
    : credits < BET_AMOUNT
      ? "Need Credits"
      : isSpinning
        ? "Spinning"
        : "Spin";

  const resultLabel = isSpinning
    ? pendingResult?.isNearMiss
      ? "Near-Miss Sequence"
      : "Calculating Spin"
    : lastResult?.isWin
      ? "Win Confirmed"
      : lastResult?.isNearMiss
        ? "Near Miss"
        : lastResult
          ? "No Win"
          : "Ready";

  return (
    <main className="min-h-dvh overflow-hidden bg-[#050505] text-white">
      <GoldRain active={showGoldRain} />
      <LiveWinnerFeed />

      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-[-12rem] h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-[#8B0000]/45 blur-[120px]" />
        <div className="absolute bottom-[-16rem] right-[-12rem] h-[32rem] w-[32rem] rounded-full bg-[#FFD700]/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:44px_44px] opacity-40" />
      </div>

      <section className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 py-5">
<header className="mb-5">
  <div className="flex items-start justify-between gap-3">
    <div>
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-[#FFD700]/70">
        <ShieldCheck className="h-3.5 w-3.5" />
        Production Session
      </div>

      <h1 className="mt-1 bg-gradient-to-r from-white via-[#FFD700] to-[#8B0000] bg-clip-text text-4xl font-black tracking-tight text-transparent">
        NAGANI
      </h1>
    </div>

    <div className="flex shrink-0 items-center gap-2">
      <div className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-2 font-mono text-[11px] font-black uppercase tracking-[0.16em] text-white/70">
          <Sparkles className="h-3.5 w-3.5 text-[#FFD700]" />
          V1
        </div>
      </div>
    </div>
  </div>

  <div className="mt-4 grid grid-cols-3 gap-2">
    <Link
  href="/lobby"
  className="rounded-full border border-white/10 bg-white/[0.055] px-3 py-2 text-center font-mono text-[10px] font-black uppercase tracking-[0.14em] text-white/45 backdrop-blur-xl transition hover:border-[#FFD700]/30 hover:text-[#FFD700]"
>
  Lobby
</Link>

    <Link
      href="/pitch"
      className="rounded-full border border-white/10 bg-white/[0.055] px-3 py-2 text-center font-mono text-[10px] font-black uppercase tracking-[0.14em] text-white/45 backdrop-blur-xl transition hover:border-[#FFD700]/30 hover:text-[#FFD700]"
    >
      Dashboard ⚙️
    </Link>

    <button
      type="button"
      onClick={handleLogout}
      className="rounded-full border border-white/10 bg-white/[0.055] px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-white/45 backdrop-blur-xl transition hover:border-red-400/30 hover:text-red-200"
    >
      <span className="flex items-center justify-center gap-1">
        <LogOut className="h-3.5 w-3.5" />
        Logout
      </span>
    </button>
  </div>
</header>

        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
              <Coins className="h-3.5 w-3.5 text-[#FFD700]" />
              Credits
            </div>

            <div className="mt-2 font-mono text-2xl font-black tracking-tight text-white">
              {walletLoading ? "Syncing..." : formatCredits(credits)}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#FFD700]/20 bg-[#FFD700]/[0.07] p-4 shadow-[0_0_32px_rgba(255,215,0,0.08)] backdrop-blur-xl">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#FFD700]/70">
              <Vault className="h-3.5 w-3.5" />
              Bonus Vault
            </div>

<div className="mt-2">
  <div className="font-mono text-2xl font-black text-[#FFD700]">
    {walletLoading ? "Syncing..." : formatCredits(lockedVault)}
  </div>

  <div className="mt-1 flex items-center gap-1 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-white/35">
    <Clock3 className="h-3 w-3" />
    Unlock in {String(minutes).padStart(2, "0")}:
    {String(seconds).padStart(2, "0")}
  </div>
</div>
          </div>
        </section>

        <section className="mt-5 rounded-[2.25rem] border border-white/10 bg-white/[0.045] p-4 shadow-[0_30px_120px_rgba(0,0,0,0.64)] backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.26em] text-white/40">
                Dragon Reels
              </div>
              <div className="mt-1 text-sm font-semibold text-white/70">
  Heavy spin physics · spring stop inertia
</div>

<div className="mt-3 inline-flex rounded-full border border-[#FFD700]/20 bg-[#FFD700]/10 px-3 py-1 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#FFD700]">
  {selectedRoom}
</div>
            </div>

            <div className="rounded-full border border-[#FFD700]/20 bg-[#FFD700]/10 p-2">
              <Gem className="h-5 w-5 text-[#FFD700] drop-shadow-[0_0_14px_rgba(255,215,0,0.7)]" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {finalReels.map((symbol, index) => (
              <SlotReel
                key={index}
                reelIndex={index}
                finalSymbol={symbol}
                isSpinning={isSpinning}
                isNearMiss={pendingResult?.isNearMiss}
                spinKey={spinKey}
                onStop={handleReelStop}
              />
            ))}
          </div>

          <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-black/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/35">
                  Spin Status
                </div>

                <div className="mt-1 text-lg font-black text-white">
                  {resultLabel}
                </div>
              </div>

              <div className="text-right">
                <div className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                  Payout
                </div>

                <div className="mt-1 font-mono text-xl font-black text-[#FFD700]">
                  {formatCredits(lastResult?.payout ?? 0)}
                </div>
              </div>
            </div>

            {pendingResult?.isNearMiss && isSpinning && (
              <motion.div
                className="mt-3 flex items-center gap-2 rounded-2xl border border-[#8B0000]/50 bg-[#8B0000]/20 px-3 py-2 text-xs font-bold text-red-100"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Flame className="h-4 w-4 text-[#FFD700]" />
                Third reel suspense active. Final reel is slowing dramatically.
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
          Wallet Awaiting Credits
        </div>

        <p className="mt-1 text-xs leading-5 text-white/45">
          This production account is active, but playable credits have not been
          seeded yet. Add demo credits before running the live spin flow.
        </p>
      </div>
    </div>
  </div>
)}

        <div className="mt-auto pt-5">
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
  className={`group relative w-full overflow-hidden rounded-[2rem] border border-[#FFD700]/40 bg-gradient-to-br from-[#FFD700] via-[#f4b400] to-[#8B0000] px-6 py-5 text-center font-black uppercase tracking-[0.28em] text-black transition ${
    !canSpin
      ? "cursor-not-allowed opacity-60"
      : "cursor-pointer"
  }`}
>
            <span className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/55 to-transparent transition-transform duration-700 group-hover:translate-x-[120%]" />

<span className="relative flex items-center justify-center gap-3">
  {spinButtonText}
  <Trophy className="h-5 w-5" />
</span>
          </motion.button>

          <div className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">
            Production session · live wallet engine active
          </div>
        </div>
      </section>
    </main>
  );
}