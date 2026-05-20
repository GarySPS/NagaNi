//app>profile>page.tsx

"use client";

import { getWallet } from "@/app/lib/actions";
import { supabase } from "@/app/lib/supabase";
import NaganiBottomNav from "@/app/components/nagani/NaganiBottomNav";
import { AnimatePresence, motion } from "framer-motion";
import {
  Banknote,
  Crown,
  Flame,
  Loader2,
  LogOut,
  Mail,
  RefreshCw,
  ShieldCheck,
  Trophy,
  UserCircle,
  Vault,
  WalletCards,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type WalletState = {
  playable_balance: number | string | null;
  locked_vault: number | string | null;
};

type ToastState = {
  title: string;
  message: string;
} | null;

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value: number | string | null | undefined) {
  return `$${toNumber(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function ProfileAsset({
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

export default function ProfilePage() {
  const router = useRouter();
  const toastTimer = useRef<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [walletLoading, setWalletLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userLabel, setUserLabel] = useState("Player");
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [errorText, setErrorText] = useState("");

  const totalCredits = useMemo(() => {
    return toNumber(wallet?.playable_balance) + toNumber(wallet?.locked_vault);
  }, [wallet]);

  useEffect(() => {
    let mounted = true;

    async function bootProfile() {
      setLoading(true);
      setErrorText("");

      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        router.replace("/auth");
        return;
      }

      if (!mounted) return;

      setUserId(data.user.id);
      setUserEmail(data.user.email ?? null);
      setUserLabel(data.user.email?.split("@")[0] || "Player");

      try {
        setWalletLoading(true);

        const nextWallet = await getWallet(data.user.id);

        if (!mounted) return;

        setWallet({
          playable_balance: nextWallet?.playable_balance ?? 0,
          locked_vault: nextWallet?.locked_vault ?? 0,
        });
      } catch {
        if (!mounted) return;

        setWallet({
          playable_balance: 0,
          locked_vault: 0,
        });
        setErrorText("Profile balance is syncing. Please refresh.");
      } finally {
        if (mounted) {
          setWalletLoading(false);
          setLoading(false);
        }
      }
    }

    void bootProfile();

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

      if (toastTimer.current) {
        window.clearTimeout(toastTimer.current);
      }
    };
  }, [router]);

  function showToast(nextToast: ToastState) {
    setToast(nextToast);

    if (toastTimer.current) {
      window.clearTimeout(toastTimer.current);
    }

    toastTimer.current = window.setTimeout(() => {
      setToast(null);
    }, 3000);
  }

  async function refreshWallet() {
    if (!userId) return;

    setRefreshing(true);
    setErrorText("");

    try {
      const nextWallet = await getWallet(userId);

      setWallet({
        playable_balance: nextWallet?.playable_balance ?? 0,
        locked_vault: nextWallet?.locked_vault ?? 0,
      });
    } catch {
      setErrorText("Profile refresh failed. Please try again.");
    } finally {
      setRefreshing(false);
    }
  }

  async function handleLogout() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.replace("/auth");
  }

  if (loading) {
    return (
      <main className="nagani-page text-white">
        <div className="mx-auto flex min-h-dvh w-full max-w-md items-center justify-center px-5">
          <div className="w-full rounded-[2rem] border border-[#FFD700]/20 bg-white/[0.05] p-8 text-center shadow-[0_0_80px_rgba(255,215,0,0.08)] backdrop-blur-xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#FFD700]/20 bg-[#FFD700]/10">
              <Loader2 className="h-5 w-5 animate-spin text-[#FFD700]" />
            </div>

            <p className="font-mono text-[10px] font-black uppercase tracking-[0.28em] text-[#FFD700]/70">
              Opening Profile
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
                <ShieldCheck className="h-5 w-5" />
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
  <ProfileAsset
    src="/assets/nagani/backgrounds/profile.webp"
    alt="Nagani profile background"
    className="absolute inset-0 h-full w-full object-cover opacity-30"
  />

  <div className="absolute inset-0 bg-[#050101]/70" />
  <div className="absolute left-1/2 top-[-10rem] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-nagani-dragon-red/45 blur-[120px]" />
  <div className="absolute bottom-[-14rem] right-[-10rem] h-[28rem] w-[28rem] rounded-full bg-nagani-gold/10 blur-[120px]" />
  <div className="absolute left-[-10rem] top-[35%] h-[24rem] w-[24rem] rounded-full bg-red-600/12 blur-[120px]" />
  <div className="nagani-grid-overlay absolute inset-0 opacity-40" />
</div>

      <section className="relative mx-auto min-h-dvh w-full max-w-md px-4 pb-28 pt-4">
        <header className="sticky top-0 z-30 -mx-4 border-b border-white/10 bg-[#120304]/88 px-4 pb-3 pt-3 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[#FFD700]/25 bg-[#FFD700]/10 text-[#FFD700]">
                  <UserCircle className="h-5 w-5" />
                </div>

                <div>
                  <div className="font-mono text-[9px] font-black uppercase tracking-[0.22em] text-[#FFD700]/70">
                    Profile
                  </div>

                  <h1 className="text-xl font-black leading-none tracking-tight text-white">
                    Account
                  </h1>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={refreshWallet}
              disabled={refreshing}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.055] text-white/60 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
            </button>
          </div>

          {errorText && (
            <div className="mt-3 rounded-[1rem] border border-red-300/25 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-100">
              {errorText}
            </div>
          )}
        </header>

<section className="relative mt-4 overflow-hidden rounded-[2.15rem] border border-[#FFD700]/25 bg-gradient-to-br from-red-500/28 via-[#FFD700]/10 to-black/75 p-4 shadow-[0_0_70px_rgba(239,68,68,0.18)]">
  <ProfileAsset
    src="/assets/nagani/ui/member-card.webp"
    alt="Nagani member card"
    className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-22"
  />

  <ProfileAsset
    src="/assets/nagani/effects/dragon-glow.webp"
    alt="Nagani dragon glow"
    className="pointer-events-none absolute -right-20 -top-16 h-72 w-72 object-contain opacity-35"
  />

  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/5 via-black/35 to-black/80" />
  <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/80 to-transparent" />

  <div className="relative z-10">
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="inline-flex rounded-full border border-[#FFD700]/30 bg-[#FFD700]/10 px-3 py-1 font-mono text-[8px] font-black uppercase tracking-[0.22em] text-[#FFD700]">
          Red Dragon Member Pass
        </div>

        <h2 className="mt-3 truncate text-3xl font-black leading-none tracking-tight text-white">
          {userLabel}
        </h2>

        <div className="mt-2 flex items-center gap-2 text-xs text-white/45">
          <Mail className="h-3.5 w-3.5 shrink-0 text-[#FFD700]/70" />
          <span className="truncate">{userEmail || "No email"}</span>
        </div>
      </div>

      <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[2rem] border border-[#FFD700]/30 bg-[#FFD700]/10 text-[#FFD700] shadow-[0_0_30px_rgba(255,215,0,0.14)]">
        <ProfileAsset
          src="/assets/nagani/ui/vip-badge.webp"
          alt="Nagani VIP badge"
          className="absolute inset-0 h-full w-full object-cover opacity-70"
        />

        <Flame className="relative z-10 h-10 w-10" />
      </div>
    </div>

    <div className="mt-5 rounded-[1.6rem] border border-[#FFD700]/20 bg-black/35 p-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="font-mono text-[8px] font-black uppercase tracking-[0.22em] text-[#FFD700]/60">
            Total Credits
          </div>

          <div className="mt-1 font-mono text-3xl font-black leading-none text-[#FFD700]">
            {walletLoading ? "..." : formatMoney(totalCredits)}
          </div>
        </div>

        <div className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 font-mono text-[8px] font-black uppercase tracking-[0.16em] text-emerald-200">
          Active
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-3 py-2">
          <div className="font-mono text-[8px] font-black uppercase tracking-[0.18em] text-white/35">
            Member ID
          </div>

          <div className="mt-1 truncate font-mono text-xs font-black text-white/70">
            {userId ? userId.slice(0, 8).toUpperCase() : "SYNCING"}
          </div>
        </div>

        <div className="rounded-2xl border border-[#FFD700]/15 bg-[#FFD700]/[0.055] px-3 py-2">
          <div className="font-mono text-[8px] font-black uppercase tracking-[0.18em] text-[#FFD700]/55">
            Tier
          </div>

          <div className="mt-1 truncate font-mono text-xs font-black text-[#FFD700]">
            Dragon Member
          </div>
        </div>
      </div>
    </div>

    <div className="mt-3 flex items-center gap-2 rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-3 py-2">
      <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-200" />

      <p className="text-xs font-semibold leading-5 text-white/45">
        Secure session active. Wallet activity is reviewed before settlement.
      </p>
    </div>
  </div>
</section>

        <section className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-[1.5rem] border border-[#FFD700]/20 bg-[#FFD700]/[0.07] p-4 shadow-[0_0_28px_rgba(255,215,0,0.08)]">
            <div className="flex items-center gap-2 font-mono text-[9px] font-black uppercase tracking-[0.18em] text-[#FFD700]/70">
              <WalletCards className="h-3.5 w-3.5" />
              Playable
            </div>

            <div className="mt-2 font-mono text-xl font-black text-white">
              {walletLoading ? "..." : formatMoney(wallet?.playable_balance)}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-red-300/20 bg-red-500/[0.08] p-4">
            <div className="flex items-center gap-2 font-mono text-[9px] font-black uppercase tracking-[0.18em] text-red-100/70">
              <Vault className="h-3.5 w-3.5" />
              Bonus Vault
            </div>

            <div className="mt-2 font-mono text-xl font-black text-red-50">
              {walletLoading ? "..." : formatMoney(wallet?.locked_vault)}
            </div>
          </div>
        </section>

        <section className="mt-5">
          <div className="mb-3">
            <div className="font-mono text-[9px] font-black uppercase tracking-[0.22em] text-[#FFD700]/70">
              Quick Access
            </div>

            <h2 className="mt-1 text-2xl font-black tracking-tight">
              Account Center
            </h2>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => router.push("/cashier")}
              className="flex w-full items-center justify-between rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4 text-left active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#FFD700]/20 bg-[#FFD700]/10 text-[#FFD700]">
                  <Banknote className="h-5 w-5" />
                </div>

                <div>
                  <div className="font-black text-white">Cashier</div>
                  <div className="mt-0.5 text-xs text-white/35">
                    Deposit and withdraw request center
                  </div>
                </div>
              </div>

              <span className="text-white/30">›</span>
            </button>

            <button
              type="button"
              onClick={() => router.push("/live")}
              className="flex w-full items-center justify-between rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4 text-left active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#FFD700]/20 bg-[#FFD700]/10 text-[#FFD700]">
                  <Trophy className="h-5 w-5" />
                </div>

                <div>
                  <div className="font-black text-white">Live Winners</div>
                  <div className="mt-0.5 text-xs text-white/35">
                    View today’s hot rooms and winners
                  </div>
                </div>
              </div>

              <span className="text-white/30">›</span>
            </button>

            <button
              type="button"
              onClick={() =>
                showToast({
                  title: "Membership",
                  message: "VIP member rewards are coming soon.",
                })
              }
              className="flex w-full items-center justify-between rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4 text-left active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-red-300/20 bg-red-500/10 text-red-100">
                  <Crown className="h-5 w-5" />
                </div>

                <div>
                  <div className="font-black text-white">VIP Center</div>
                  <div className="mt-0.5 text-xs text-white/35">
                    Rewards, badges, and member benefits
                  </div>
                </div>
              </div>

              <span className="text-white/30">›</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              disabled={signingOut}
              className="flex w-full items-center justify-center gap-3 rounded-[1.5rem] border border-red-300/20 bg-red-500/10 px-4 py-4 font-black text-red-100 active:scale-[0.99] disabled:opacity-60"
            >
              {signingOut ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <LogOut className="h-5 w-5" />
              )}
              {signingOut ? "Signing Out" : "Logout"}
            </button>
          </div>
        </section>
      </section>

<NaganiBottomNav active="profile" />
    </main>
  );
}