//app>page.tsx

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { getWallet, playSpin } from "./lib/actions";
import { useRouter, useSearchParams } from "next/navigation";
import LiveWinnerFeed from "./components/nagani/LiveWinnerFeed";
import { supabase } from "./lib/supabase";
import {
  AlertTriangle,
  Clock3,
  Coins,
  Flame,
  Home,
  RotateCw,
  Smartphone,
  Trophy,
  UserCircle,
  Vault,
} from "lucide-react";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import DragonSlotBoard from "./components/nagani/DragonSlotBoard";
import type { ReelSymbolKey } from "./components/nagani/SlotReel";

type SpinPayload = {
  isWin: boolean;
  payout: number;
  isNearMiss: boolean;
  finalReels: ReelSymbolKey[];
};

const BET_AMOUNT = 25;
const ROTATE_HINT_STORAGE_KEY = "nagani_rotate_hint_do_not_show_v1";

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
      subtitle: "Entry Room",
      mood: "Low volatility",
      badge: "border-emerald-300/30 bg-emerald-400/10 text-emerald-100",
      cabinetGlow: "shadow-[0_0_80px_rgba(16,185,129,0.13)]",
      ambientGlow: "bg-emerald-500/20",
    };
  }

  if (roomName === "Dragon's Peak") {
    return {
      label: "Dragon's Peak",
      subtitle: "Fire Room",
      mood: "High volatility",
      badge: "border-red-300/30 bg-red-500/10 text-red-100",
      cabinetGlow: "shadow-[0_0_90px_rgba(239,68,68,0.22)]",
      ambientGlow: "bg-red-600/30",
    };
  }

  return {
    label: "Golden Buffalo",
    subtitle: "Classic Room",
    mood: "Medium volatility",
    badge: "border-[#FFD700]/35 bg-[#FFD700]/10 text-[#FFD700]",
    cabinetGlow: "shadow-[0_0_90px_rgba(250,204,21,0.16)]",
    ambientGlow: "bg-[#FFD700]/16",
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

export default function NaganiPage() {
  return (
    <Suspense fallback={<NaganiPageLoading />}>
      <NaganiGame />
    </Suspense>
  );
}

function NaganiPageLoading() {
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

function NaganiLaunchOverlay({ roomName }: { roomName: RoomName }) {
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

function RotatePhoneWelcome({
  onClose,
}: {
  onClose: (doNotShowAgain: boolean) => void;
}) {
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

function NaganiGame() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedRoom = resolveRoomName(searchParams.get("room"));
  const roomSkin = getRoomSkin(selectedRoom);

const [introVisible, setIntroVisible] = useState(true);
const [showRotateHint, setShowRotateHint] = useState(false);
const [rotateHintDismissedThisSession, setRotateHintDismissedThisSession] =
  useState(false);
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
    const timer = window.setTimeout(() => {
      setIntroVisible(false);
    }, 1450);

    return () => window.clearTimeout(timer);
  }, []);

useEffect(() => {
  if (introVisible) return;

  function syncRotateHint() {
    const doNotShowAgain =
      window.localStorage.getItem(ROTATE_HINT_STORAGE_KEY) === "true";

    const isMobileWidth = window.matchMedia("(max-width: 767px)").matches;
    const isPortrait = window.matchMedia("(orientation: portrait)").matches;

    setShowRotateHint(
      !doNotShowAgain &&
        !rotateHintDismissedThisSession &&
        isMobileWidth &&
        isPortrait
    );
  }

  syncRotateHint();

  window.addEventListener("resize", syncRotateHint);
  window.addEventListener("orientationchange", syncRotateHint);

  return () => {
    window.removeEventListener("resize", syncRotateHint);
    window.removeEventListener("orientationchange", syncRotateHint);
  };
}, [introVisible, rotateHintDismissedThisSession]);

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

  useEffect(() => {
    const timer = window.setInterval(() => {
      setVaultSeconds((current) => (current <= 0 ? 89 : current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isSpinning || stoppedReels < 5 || !pendingResult) return;

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

      const safeFinalReels = Array.isArray(result.finalReels)
        ? result.finalReels
        : finalReels;

      const mappedResult: SpinPayload = {
        isWin: Boolean(result.isWin),
        payout: Number(result.payout || 0),
        isNearMiss: Boolean(result.isNearMiss),
        finalReels: safeFinalReels.map((symbol) =>
          String(symbol).toLowerCase()
        ) as ReelSymbolKey[],
      };

      setPendingResult(mappedResult);
      setFinalReels(mappedResult.finalReels);
      setCredits((current) => Math.max(0, current - BET_AMOUNT));
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

function handleCloseRotateHint(doNotShowAgain: boolean) {
  if (doNotShowAgain) {
    window.localStorage.setItem(ROTATE_HINT_STORAGE_KEY, "true");
  }

  setRotateHintDismissedThisSession(true);
  setShowRotateHint(false);
}

  function handlePrimaryAction() {
    if (!authLoading && !walletLoading && credits < BET_AMOUNT && !isSpinning) {
      router.push("/cashier");
      return;
    }

    void handleSpin();
  }

  function handleReelStop() {
    setStoppedReels((current) => current + 1);
  }

  const minutes = Math.floor(vaultSeconds / 60);
  const seconds = vaultSeconds % 60;
  const vaultTimer = `${minutes}:${String(seconds).padStart(2, "0")}`;

  const canSpin =
    !authLoading &&
    !walletLoading &&
    !!userId &&
    !isSpinning &&
    credits >= BET_AMOUNT;

  const canOpenCashier =
    !authLoading && !walletLoading && !!userId && !isSpinning && credits < BET_AMOUNT;

  const primaryEnabled = canSpin || canOpenCashier;

  const spinButtonText = authLoading
    ? "Checking"
    : walletLoading
      ? "Syncing"
      : credits < BET_AMOUNT
        ? "Cashier"
        : isSpinning
          ? "Spinning"
          : "Spin";

  const resultLabel = isSpinning
    ? pendingResult?.isNearMiss
      ? "Final Reel Hold"
      : "Spinning..."
    : lastResult?.isWin
      ? "Dragon Win"
      : lastResult?.isNearMiss
        ? "Almost"
        : lastResult
          ? "Try Again"
          : "Ready";

  return (
  <main className="relative min-h-dvh overflow-x-hidden bg-[#030000] text-white">
      <GoldRain active={showGoldRain} />
      <LiveWinnerFeed />

      <AnimatePresence>
        {introVisible && <NaganiLaunchOverlay roomName={selectedRoom} />}
      </AnimatePresence>

      <AnimatePresence>
  {showRotateHint && <RotatePhoneWelcome onClose={handleCloseRotateHint} />}
</AnimatePresence>

      <div className="pointer-events-none fixed inset-0">
        <div
          className={`absolute left-1/2 top-[-14rem] h-[36rem] w-[36rem] -translate-x-1/2 rounded-full ${roomSkin.ambientGlow} blur-[130px]`}
        />
        <div className="absolute bottom-[-16rem] right-[-12rem] h-[34rem] w-[34rem] rounded-full bg-[#FFD700]/10 blur-[120px]" />
        <div className="absolute left-[-16rem] top-1/3 h-[30rem] w-[30rem] rounded-full bg-red-950/30 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(250,204,21,0.10),transparent_30%),linear-gradient(180deg,rgba(0,0,0,0.2),rgba(0,0,0,0.82))]" />
        <div className="nagani-grid-overlay absolute inset-0 opacity-25" />
      </div>

      <section className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[1180px] flex-col px-3 py-3 sm:px-5">
        <header className="flex items-center justify-between gap-3 rounded-[1.5rem] border border-[#FFD700]/15 bg-black/35 px-3 py-2 shadow-[0_18px_70px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
          <button
            type="button"
            onClick={() => router.push("/lobby")}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.055] text-white/60 active:scale-95"
            aria-label="Back to lobby"
          >
            <Home className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1 text-center">
            <div className="flex items-center justify-center gap-2 font-mono text-[8px] font-black uppercase tracking-[0.28em] text-[#FFD700]/75">
              <Flame className="h-3 w-3" />
              နဂါးနီ · Live
            </div>

            <h1 className="truncate bg-gradient-to-r from-white via-[#FFD700] to-red-500 bg-clip-text text-[1.45rem] font-black leading-none tracking-tight text-transparent sm:text-3xl">
              NAGANI
            </h1>
          </div>

          <button
            type="button"
            onClick={() => router.push("/profile")}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.055] text-white/60 active:scale-95"
            aria-label="Open profile"
          >
            <UserCircle className="h-5 w-5" />
          </button>
        </header>

        <section className="grid flex-1 items-center gap-4 py-3 lg:grid-cols-[minmax(0,820px)_280px]">
          <section
            className={`relative mx-auto w-full max-w-[820px] rounded-[2.25rem] border border-[#FFD700]/20 bg-gradient-to-b from-[#250303]/92 via-[#0a0101]/96 to-black p-3 ${roomSkin.cabinetGlow}`}
          >
            <div className="pointer-events-none absolute inset-0 rounded-[2.25rem] bg-[radial-gradient(circle_at_50%_0%,rgba(250,204,21,0.18),transparent_34%)]" />
            <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/90 to-transparent" />

            <div className="relative mb-3 flex items-center justify-between gap-3">
              <div>
                <div
                  className={`inline-flex rounded-full border px-3 py-1 font-mono text-[8px] font-black uppercase tracking-[0.18em] ${roomSkin.badge}`}
                >
                  {roomSkin.subtitle}
                </div>

                <div className="mt-2 text-xl font-black leading-none text-white sm:text-2xl">
                  {roomSkin.label}
                </div>

                <div className="mt-1 font-mono text-[9px] font-black uppercase tracking-[0.18em] text-white/35">
                  {roomSkin.mood} · Asset-first cabinet
                </div>
              </div>

              <button
                type="button"
                onClick={() => router.push("/cashier")}
                className="rounded-[1.25rem] border border-[#FFD700]/25 bg-[#FFD700]/10 px-4 py-3 text-right active:scale-[0.98]"
              >
                <div className="font-mono text-[8px] font-black uppercase tracking-[0.18em] text-[#FFD700]/70">
                  Credits
                </div>

                <div className="mt-1 font-mono text-base font-black text-[#FFD700] sm:text-lg">
                  {walletLoading ? "..." : formatCredits(credits)}
                </div>
              </button>
            </div>

            <DragonSlotBoard
              finalReels={finalReels}
              isSpinning={isSpinning}
              isNearMiss={pendingResult?.isNearMiss}
              spinKey={spinKey}
              onStop={handleReelStop}
            />

            <div className="relative mt-3 rounded-[1.75rem] border border-[#FFD700]/15 bg-black/55 p-3 shadow-[inset_0_0_34px_rgba(0,0,0,0.75)]">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-[1.15rem] border border-white/10 bg-white/[0.045] px-3 py-2">
                  <div className="flex items-center gap-1.5 font-mono text-[7px] font-black uppercase tracking-[0.16em] text-white/35">
                    <Coins className="h-3 w-3 text-[#FFD700]" />
                    Bet
                  </div>

                  <div className="mt-1 font-mono text-sm font-black text-white">
                    {formatCredits(BET_AMOUNT)}
                  </div>
                </div>

                <div className="rounded-[1.15rem] border border-[#FFD700]/20 bg-[#FFD700]/[0.07] px-3 py-2 text-center">
                  <div className="font-mono text-[7px] font-black uppercase tracking-[0.16em] text-[#FFD700]/65">
                    Win
                  </div>

                  <div className="mt-1 font-mono text-sm font-black text-[#FFD700]">
                    {formatCredits(lastResult?.payout ?? 0)}
                  </div>
                </div>

                <div className="rounded-[1.15rem] border border-white/10 bg-white/[0.045] px-3 py-2 text-right">
                  <div className="font-mono text-[7px] font-black uppercase tracking-[0.16em] text-white/35">
                    State
                  </div>

                  <div className="mt-1 truncate text-sm font-black text-white">
                    {resultLabel}
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

              {!walletLoading && credits < BET_AMOUNT && (
                <div className="mt-3 rounded-2xl border border-[#FFD700]/20 bg-[#FFD700]/[0.06] px-3 py-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#FFD700]" />

                    <p className="text-xs font-semibold leading-5 text-white/50">
                      Credit balance is below the current bet. Open Cashier to
                      continue the session.
                    </p>
                  </div>
                </div>
              )}

              <motion.button
                type="button"
                onClick={handlePrimaryAction}
                aria-disabled={!primaryEnabled}
                whileTap={{ scale: primaryEnabled ? 0.94 : 1 }}
                animate={{
                  boxShadow: isSpinning
                    ? "0 0 18px rgba(255,215,0,0.18)"
                    : [
                        "0 0 22px rgba(255,215,0,0.24)",
                        "0 0 58px rgba(255,215,0,0.52)",
                        "0 0 22px rgba(255,215,0,0.24)",
                      ],
                }}
                transition={{
                  duration: 1.8,
                  repeat: isSpinning ? 0 : Infinity,
                }}
                className={`nagani-gold-button group relative mt-3 w-full overflow-hidden rounded-[1.65rem] px-6 py-4 text-center font-black uppercase tracking-[0.34em] transition ${
                  !primaryEnabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
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

          <aside className="hidden lg:block">
            <div className="space-y-3">
              <div className="rounded-[1.75rem] border border-[#FFD700]/15 bg-black/45 p-4 shadow-[0_18px_70px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
                <div className="font-mono text-[9px] font-black uppercase tracking-[0.22em] text-[#FFD700]/65">
                  Session Wallet
                </div>

                <div className="mt-4 space-y-2">
                  <button
                    type="button"
                    onClick={() => router.push("/cashier")}
                    className="w-full rounded-[1.25rem] border border-[#FFD700]/20 bg-[#FFD700]/[0.07] p-3 text-left active:scale-[0.99]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-mono text-[8px] font-black uppercase tracking-[0.18em] text-[#FFD700]/65">
                        <Coins className="h-3.5 w-3.5" />
                        Playable
                      </div>

                      <div className="font-mono text-sm font-black text-[#FFD700]">
                        {walletLoading ? "..." : formatCredits(credits)}
                      </div>
                    </div>
                  </button>

                  <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-mono text-[8px] font-black uppercase tracking-[0.18em] text-white/40">
                        <Vault className="h-3.5 w-3.5 text-[#FFD700]" />
                        Vault
                      </div>

                      <div className="font-mono text-sm font-black text-white">
                        {walletLoading ? "..." : formatCredits(lockedVault)}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-mono text-[8px] font-black uppercase tracking-[0.18em] text-white/40">
                        <Clock3 className="h-3.5 w-3.5 text-[#FFD700]" />
                        Vault Pulse
                      </div>

                      <div className="font-mono text-sm font-black text-white">
                        {vaultTimer}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-red-400/15 bg-red-950/20 p-4 shadow-[0_18px_70px_rgba(0,0,0,0.36)] backdrop-blur-2xl">
                <div className="font-mono text-[9px] font-black uppercase tracking-[0.22em] text-red-200/70">
                  Cabinet State
                </div>

                <div className="mt-3 text-2xl font-black text-white">
                  {resultLabel}
                </div>

                <p className="mt-2 text-xs font-semibold leading-5 text-white/42">
                  The center payline is controlled by the verified spin result.
                  Outer symbols are visual reel filler for the 5×3 cabinet.
                </p>
              </div>
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}