//app>page.tsx

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { getWallet, playSpin } from "./lib/actions";
import { playNaganiSound } from "./lib/naganiSound";
import { useRouter, useSearchParams } from "next/navigation";
import LiveWinnerFeed from "./components/nagani/LiveWinnerFeed";
import { supabase } from "./lib/supabase";
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
import { Suspense, useCallback, useEffect, useState } from "react";
import DragonSlotBoard from "./components/nagani/DragonSlotBoard";
import type { ReelSymbolKey } from "./components/nagani/SlotReel";
import GameSessionAsset from "./components/nagani/game/GameSessionAsset";
import GoldRain from "./components/nagani/game/GoldRain";
import NaganiPageLoading from "./components/nagani/game/NaganiPageLoading";
import NaganiLaunchOverlay from "./components/nagani/game/NaganiLaunchOverlay";
import RotatePhoneWelcome from "./components/nagani/game/RotatePhoneWelcome";
import WinCelebrationOverlay from "./components/nagani/game/WinCelebrationOverlay";
import {
  BET_AMOUNT,
  ROTATE_HINT_STORAGE_KEY,
  formatCredits,
  getRoomSkin,
  resolveRoomName,
} from "./components/nagani/game/naganiGameConfig";

type SpinPayload = {
  isWin: boolean;
  payout: number;
  isNearMiss: boolean;
  finalReels: ReelSymbolKey[];
};

export default function NaganiPage() {
  return (
    <Suspense fallback={<NaganiPageLoading />}>
      <NaganiGame />
    </Suspense>
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
  const [showWinCelebration, setShowWinCelebration] = useState(false);

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
  const isBigWin = pendingResult.payout >= BET_AMOUNT * 50;

  playNaganiSound(isBigWin ? "bigWin" : "win");

  setShowGoldRain(true);
  setShowWinCelebration(true);

  window.setTimeout(() => setShowGoldRain(false), 2400);
  window.setTimeout(() => setShowWinCelebration(false), 2800);
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
  playNaganiSound("spin");

setShowGoldRain(false);
setShowWinCelebration(false);
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
  playNaganiSound("button");

  if (!authLoading && !walletLoading && credits < BET_AMOUNT && !isSpinning) {
    router.push("/cashier");
    return;
  }

  void handleSpin();
}

function handleReelStop() {
  playNaganiSound("reelStop");
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

<AnimatePresence>
  <WinCelebrationOverlay
  active={showWinCelebration}
  result={lastResult}
  betAmount={BET_AMOUNT}
/>
</AnimatePresence>

<LiveWinnerFeed />

      <AnimatePresence>
        {introVisible && <NaganiLaunchOverlay roomName={selectedRoom} />}
      </AnimatePresence>

      <AnimatePresence>
  {showRotateHint && <RotatePhoneWelcome onClose={handleCloseRotateHint} />}
</AnimatePresence>

<div className="pointer-events-none fixed inset-0">
  <GameSessionAsset
    src="/assets/nagani/backgrounds/game-session.webp"
    alt="Nagani game session background"
    className="absolute inset-0 h-full w-full object-cover opacity-35"
  />

  <div className="absolute inset-0 bg-[#030000]/55" />

  <div
    className={`absolute left-1/2 top-[-14rem] h-[36rem] w-[36rem] -translate-x-1/2 rounded-full ${roomSkin.ambientGlow} blur-[130px]`}
  />
        <div className="absolute bottom-[-16rem] right-[-12rem] h-[34rem] w-[34rem] rounded-full bg-[#FFD700]/10 blur-[120px]" />
        <div className="absolute left-[-16rem] top-1/3 h-[30rem] w-[30rem] rounded-full bg-red-950/30 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(250,204,21,0.10),transparent_30%),linear-gradient(180deg,rgba(0,0,0,0.2),rgba(0,0,0,0.82))]" />
        <div className="nagani-grid-overlay absolute inset-0 opacity-25" />
      </div>

     <section className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[1180px] flex-col px-3 pb-8 pt-3 sm:px-5 lg:pb-3">
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

            <div className="relative z-10 mb-3 flex items-center justify-between gap-3">
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

<div className="relative z-10">
  <DragonSlotBoard
    finalReels={finalReels}
    isSpinning={isSpinning}
    isNearMiss={pendingResult?.isNearMiss}
    spinKey={spinKey}
    onStop={handleReelStop}
  />
</div>

            <div className="relative z-10 mt-3 rounded-[1.75rem] border border-[#FFD700]/15 bg-black/55 p-3 shadow-[inset_0_0_34px_rgba(0,0,0,0.75)]">
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
                className={`nagani-gold-button group relative mt-3 w-full touch-manipulation overflow-hidden rounded-[1.65rem] px-6 py-4 text-center font-black uppercase tracking-[0.34em] transition ${
                  !primaryEnabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                }`}
              >
<GameSessionAsset
  src="/assets/nagani/ui/spin-button.webp"
  alt="Nagani spin button"
  className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-45"
/>

<span className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/55 to-transparent transition-transform duration-700 group-hover:translate-x-[120%]" />

<span className="relative z-10 flex items-center justify-center gap-3">
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