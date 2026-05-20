//app>cashier>page.tsx

"use client";

import {
  getWallet,
  getWalletRequests,
  submitWalletRequest,
  type WalletRequestStatus,
  type WalletRequestTicket,
} from "@/app/lib/actions";
import { supabase } from "@/app/lib/supabase";
import NaganiBottomNav from "@/app/components/nagani/NaganiBottomNav";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Coins,
  Flame,
  Loader2,
  RefreshCw,
  Vault,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type RequestType = "deposit" | "withdraw";

type WalletState = {
  playable_balance: number | string | null;
  locked_vault: number | string | null;
};

type PendingRequest = {
  id: string;
  type: RequestType;
  amount: number;
  status: WalletRequestStatus;
  createdAt: string;
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

function formatTicketDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mapWalletTicket(ticket: WalletRequestTicket): PendingRequest {
  return {
    id: ticket.id,
    type: ticket.type,
    amount: ticket.amount,
    status: ticket.status,
    createdAt: formatTicketDate(ticket.created_at),
  };
}

function getStatusClass(status: WalletRequestStatus) {
  if (status === "approved") {
    return "border-emerald-300/20 bg-emerald-400/10 text-emerald-200";
  }

  if (status === "rejected") {
    return "border-red-300/20 bg-red-400/10 text-red-200";
  }

  return "border-[#FFD700]/20 bg-[#FFD700]/10 text-[#FFD700]";
}

export default function CashierPage() {
  const router = useRouter();
  const toastTimer = useRef<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [walletLoading, setWalletLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [wallet, setWallet] = useState<WalletState | null>(null);

  const [requestType, setRequestType] = useState<RequestType>("deposit");
  const [amount, setAmount] = useState("");
  const [errorText, setErrorText] = useState("");
  const [toast, setToast] = useState<ToastState>(null);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);

  const totalCredits = useMemo(() => {
    return toNumber(wallet?.playable_balance) + toNumber(wallet?.locked_vault);
  }, [wallet]);

  useEffect(() => {
    let mounted = true;

    async function bootCashier() {
      setLoading(true);
      setErrorText("");

      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        router.replace("/auth");
        return;
      }

      if (!mounted) return;

      setUserId(data.user.id);

      try {
        setWalletLoading(true);

const [nextWallet, tickets] = await Promise.all([
  getWallet(data.user.id),
  getWalletRequests(data.user.id),
]);

if (!mounted) return;

setWallet({
  playable_balance: nextWallet?.playable_balance ?? 0,
  locked_vault: nextWallet?.locked_vault ?? 0,
});

setPendingRequests(tickets.map(mapWalletTicket));
      } catch {
        if (!mounted) return;

        setWallet({
          playable_balance: 0,
          locked_vault: 0,
        });
        setErrorText("Balance is syncing. Please refresh in a moment.");
      } finally {
        if (mounted) {
          setWalletLoading(false);
          setLoading(false);
        }
      }
    }

    void bootCashier();

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
    const [nextWallet, tickets] = await Promise.all([
      getWallet(userId),
      getWalletRequests(userId),
    ]);

    setWallet({
      playable_balance: nextWallet?.playable_balance ?? 0,
      locked_vault: nextWallet?.locked_vault ?? 0,
    });

    setPendingRequests(tickets.map(mapWalletTicket));
  } catch {
    setErrorText("Balance refresh failed. Please try again.");
  } finally {
    setRefreshing(false);
  }
}

async function handleSubmit() {
  const parsedAmount = Number(amount);

  setErrorText("");

  if (!userId) {
    setErrorText("Session expired. Please sign in again.");
    return;
  }

  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    setErrorText("Enter a valid amount.");
    return;
  }

  if (
    requestType === "withdraw" &&
    parsedAmount > toNumber(wallet?.playable_balance)
  ) {
    setErrorText("Withdraw amount cannot exceed playable balance.");
    return;
  }

  setSubmitting(true);

  try {
    const result = await submitWalletRequest(userId, requestType, parsedAmount);

    if (!result.ok) {
      setErrorText(result.error);
      return;
    }

    setPendingRequests((current) => [
      mapWalletTicket(result.ticket),
      ...current,
    ].slice(0, 10));

    setAmount("");

    showToast({
      title: "Request Submitted",
      message: `${requestType === "deposit" ? "Deposit" : "Withdraw"} request is waiting for review.`,
    });
  } catch {
    setErrorText("Request failed. Please try again.");
  } finally {
    setSubmitting(false);
  }
}

  const activeTypeLabel = requestType === "deposit" ? "Deposit" : "Withdraw";

  if (loading) {
    return (
      <main className="nagani-page text-white">
        <div className="mx-auto flex min-h-dvh w-full max-w-md items-center justify-center px-5">
          <div className="w-full rounded-[2rem] border border-[#FFD700]/20 bg-white/[0.05] p-8 text-center shadow-[0_0_80px_rgba(255,215,0,0.08)] backdrop-blur-xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#FFD700]/20 bg-[#FFD700]/10">
              <Loader2 className="h-5 w-5 animate-spin text-[#FFD700]" />
            </div>

            <p className="font-mono text-[10px] font-black uppercase tracking-[0.28em] text-[#FFD700]/70">
              Opening Balance
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
                <CheckCircle2 className="h-5 w-5" />
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
        <div className="absolute left-1/2 top-[-10rem] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[#8B0000]/45 blur-[120px]" />
        <div className="absolute bottom-[-14rem] right-[-10rem] h-[28rem] w-[28rem] rounded-full bg-[#FFD700]/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:44px_44px] opacity-40" />
      </div>

      <section className="relative mx-auto min-h-dvh w-full max-w-md px-4 pb-28 pt-4">
        <header className="sticky top-0 z-30 -mx-4 border-b border-white/10 bg-[#120304]/88 px-4 pb-3 pt-3 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[#FFD700]/25 bg-[#FFD700]/10 text-[#FFD700]">
                  <Flame className="h-5 w-5" />
                </div>

                <div>
                  <div className="font-mono text-[9px] font-black uppercase tracking-[0.22em] text-[#FFD700]/70">
                    Balance
                  </div>
                  <h1 className="text-xl font-black leading-none tracking-tight text-white">
                    Cashier
                  </h1>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push("/cashier")}
              className="min-w-0 rounded-2xl border border-[#FFD700]/20 bg-[#FFD700]/10 px-3 py-2 text-right shadow-[0_0_22px_rgba(255,215,0,0.08)]"
            >
              <div className="font-mono text-[8px] font-black uppercase tracking-[0.16em] text-[#FFD700]/70">
                Total
              </div>
              <div className="max-w-[8rem] truncate font-mono text-sm font-black text-[#FFD700]">
                {formatMoney(totalCredits)}
              </div>
            </button>

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
            <div className="mt-3 flex items-start gap-2 rounded-[1rem] border border-red-300/25 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-100">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {errorText}
            </div>
          )}
        </header>

        <section className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-[1.5rem] border border-[#FFD700]/20 bg-[#FFD700]/[0.07] p-4 shadow-[0_0_28px_rgba(255,215,0,0.08)]">
            <div className="flex items-center gap-2 font-mono text-[9px] font-black uppercase tracking-[0.18em] text-[#FFD700]/70">
              <Coins className="h-3.5 w-3.5" />
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

<section className="mt-4 overflow-hidden rounded-[2rem] border border-[#FFD700]/20 bg-black/60 shadow-[0_24px_80px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
          <div className="border-b border-white/5 bg-gradient-to-br from-[#8B0000]/30 via-[#FFD700]/10 to-black p-5">
            <div className="flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-[0.24em] text-[#FFD700]/70">
              <Vault className="h-4 w-4" />
              Secure Cage
            </div>
            
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
              Asset Transfer
            </h2>
            
<p className="mt-2 text-xs leading-relaxed text-white/50">
  All requests are logged to the secure ledger and require review before wallet settlement.
</p>
          </div>

          <div className="p-5">
            <div className="grid grid-cols-2 gap-2 rounded-[1.2rem] border border-white/10 bg-black/40 p-1">
              {(["deposit", "withdraw"] as RequestType[]).map((type) => {
                const active = requestType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setRequestType(type);
                      setErrorText("");
                      setAmount("");
                    }}
                    className={`rounded-xl px-4 py-3 font-mono text-[11px] font-black uppercase tracking-[0.2em] transition ${
                      active
                        ? "bg-gradient-to-b from-[#FFD700] to-[#d4af37] text-black shadow-[0_0_20px_rgba(255,215,0,0.3)]"
                        : "text-white/40 hover:text-white/70 active:bg-white/[0.05]"
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-white/5 bg-[#0a0202]/80 p-5 shadow-inner">
              <label className="block text-center font-mono text-[9px] font-black uppercase tracking-[0.24em] text-white/35">
                Enter {requestType} Amount
              </label>

              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="text-3xl font-black text-[#FFD700]/50">$</span>
                <input
                  value={amount}
                  onChange={(event) => {
                    setAmount(event.target.value);
                    setErrorText("");
                  }}
                  inputMode="decimal"
                  placeholder="0.00"
                  className="w-[160px] bg-transparent text-center font-mono text-5xl font-black tracking-tighter text-white outline-none placeholder:text-white/10"
                />
              </div>

              <div className="mt-5 grid grid-cols-4 gap-2">
                {(requestType === "deposit" ? [50, 100, 250, 500] : [50, 100, 250, "MAX"]).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      if (val === "MAX") {
                        setAmount(String(toNumber(wallet?.playable_balance)));
                      } else {
                        setAmount(String(val));
                      }
                      setErrorText("");
                    }}
                    className="rounded-xl border border-white/10 bg-white/[0.03] py-2.5 font-mono text-[10px] font-black text-white/70 hover:bg-white/[0.08] hover:text-[#FFD700] active:scale-95"
                  >
                    {val === "MAX" ? "MAX" : `+$${val}`}
                  </button>
                ))}
              </div>
            </div>

            <motion.button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              whileTap={{ scale: submitting ? 1 : 0.96 }}
              className="mt-5 flex w-full items-center justify-center gap-3 rounded-[1.25rem] border border-red-500/50 bg-gradient-to-r from-[#8B0000] via-red-600 to-[#8B0000] px-5 py-4 font-mono text-sm font-black uppercase tracking-[0.2em] text-white shadow-[0_0_30px_rgba(220,38,38,0.25)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Vault className="h-5 w-5" />
              )}
              {submitting ? "Processing" : `Submit ${activeTypeLabel}`}
            </motion.button>
          </div>
        </section>

        <section className="mt-5">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <div className="font-mono text-[9px] font-black uppercase tracking-[0.22em] text-[#FFD700]/70">
                Cashier Tickets
              </div>

              <h2 className="mt-1 text-2xl font-black tracking-tight">
                Recent Tickets
              </h2>
            </div>

            <div className="rounded-full border border-white/10 bg-black/25 px-3 py-1 font-mono text-[9px] font-black uppercase tracking-[0.16em] text-white/35">
              {pendingRequests.length} Tickets
            </div>
          </div>

          <div className="space-y-3">
            {pendingRequests.length === 0 ? (
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5 text-center backdrop-blur-xl">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.055] text-white/40">
                  <Banknote className="h-5 w-5" />
                </div>

                <p className="mt-3 text-sm font-bold text-white/65">
                  No active tickets.
                </p>

                <p className="mt-1 text-xs leading-5 text-white/35">
                  Submit a deposit or withdraw request to create a pending
                  ticket.
                </p>
              </div>
            ) : (
              pendingRequests.map((request) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="rounded-[1.5rem] border border-[#FFD700]/20 bg-[#FFD700]/[0.055] p-4 shadow-[0_0_32px_rgba(255,215,0,0.08)] backdrop-blur-xl"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-mono text-[9px] font-black uppercase tracking-[0.2em] text-[#FFD700]/70">
                       {request.status === "approved"
  ? "Approved"
  : request.status === "rejected"
    ? "Rejected"
    : "Pending Review"}
                      </div>

                      <div className="mt-1 text-lg font-black capitalize text-white">
                        {request.type} Ticket
                      </div>

                      <div className="mt-1 text-xs text-white/40">
                        Submitted {request.createdAt}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono text-lg font-black text-[#FFD700]">
                        {formatMoney(request.amount)}
                      </div>

<div
  className={`mt-1 rounded-full border px-3 py-1 font-mono text-[8px] font-black uppercase tracking-[0.16em] ${getStatusClass(
    request.status
  )}`}
>
  {request.status}
</div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-3 py-2">
                    <span className="font-mono text-[8px] font-black uppercase tracking-[0.16em] text-white/30">
                      Ticket ID
                    </span>

                    <span className="max-w-[9rem] truncate font-mono text-[10px] font-black text-white/45">
                      {request.id}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </section>
      </section>

<NaganiBottomNav active="balance" />
    </main>
  );
}