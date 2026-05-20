//app>admin>page.tsx

"use client";

import {
  checkIsAdmin,
  getAllPendingTransactions,
  resolveTransaction,
  getPlayerList,
  updatePlayerRTP,
} from "@/app/lib/actions";
import { supabase } from "@/app/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Coins,
  Gauge,
  Layers3,
  Loader2,
  LockKeyhole,
  LogOut,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Terminal,
  UserCog,
  WalletCards,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type TransactionType = "deposit" | "withdraw";
type TransactionStatus = "pending" | "approved" | "rejected";
type TransactionResolution = "approved" | "rejected";

type TransactionRow = {
  id: string;
  userId: string;
  player: string;
  type: TransactionType;
  amount: number;
  method: string;
  status: TransactionStatus;
  createdAt: string;
};

type UserControlRow = {
  id: string;
  player: string;
  room: string;
  playableBalance: number;
  rtpModifier: number;
  riskBand: "Standard" | "Boosted" | "Conservative";
};


function formatMoney(value: number) {
  return Number(value || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getStatusVisual(status: TransactionStatus) {
  if (status === "approved") {
    return "border-emerald-400/25 bg-emerald-400/10 text-emerald-200";
  }

  if (status === "rejected") {
    return "border-red-400/25 bg-red-400/10 text-red-200";
  }

  return "border-[#FFD700]/25 bg-[#FFD700]/10 text-[#FFD700]";
}

function getRtpTone(value: number) {
  if (value > 1.15) {
    return {
      label: "Boosted Scenario",
      border: "border-emerald-400/25",
      bg: "bg-emerald-400/10",
      text: "text-emerald-200",
    };
  }

  if (value < 0.9) {
    return {
      label: "Conservative Scenario",
      border: "border-red-400/25",
      bg: "bg-red-400/10",
      text: "text-red-200",
    };
  }

  return {
    label: "Standard Scenario",
    border: "border-[#FFD700]/25",
    bg: "bg-[#FFD700]/10",
    text: "text-[#FFD700]",
  };
}

function maskPlayer(userId: string) {
  if (!userId) return "Player";
  return `Player ${userId.slice(0, 4)}***`;
}

function formatTransactionDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mapTransactionRow(row: {
  id: string;
  user_id: string;
  type: string;
  amount: number | string;
  status: string;
  created_at: string;
}): TransactionRow {
  return {
    id: row.id,
    userId: row.user_id,
    player: maskPlayer(row.user_id),
    type: row.type === "withdraw" ? "withdraw" : "deposit",
    amount: Number(row.amount || 0),
    method: "Ledger",
    status:
      row.status === "approved" || row.status === "rejected"
        ? row.status
        : "pending",
    createdAt: formatTransactionDate(row.created_at),
  };
}

export default function AdminPage() {
  const router = useRouter();

  const [authLoading, setAuthLoading] = useState(true);
  const [userLabel, setUserLabel] = useState("Operator");
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [resolvingTransactionId, setResolvingTransactionId] =
    useState<string | null>(null);
  const [users, setUsers] = useState<UserControlRow[]>([]);
  const [statusText, setStatusText] = useState(
    "Admin console ready. Real transaction queue will sync after login."
  );
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  async function loadPendingTransactions() {
    setTransactionsLoading(true);

    try {
      const rows = await getAllPendingTransactions();
      setTransactions(rows.map(mapTransactionRow));
      setStatusText("Pending transaction queue synced.");
    } catch {
      setStatusText("Failed to sync pending transactions.");
    } finally {
      setTransactionsLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

async function bootAdmin() {
      const { data, error } = await supabase.auth.getUser();

      if (!mounted) return;

      if (error || !data.user) {
        router.replace("/auth");
        return;
      }

      const isAdmin = await checkIsAdmin(data.user.id);

      if (!mounted) return;

      if (!isAdmin) {
        router.replace("/lobby");
        return;
      }

      const playerList = await getPlayerList();
      
      setUsers(playerList.map((u: any) => ({
        id: u.id,
        player: maskPlayer(u.id),
        room: "Golden Buffalo",
        playableBalance: Number(u.playable_balance),
        rtpModifier: Number(u.rtp_modifier),
        riskBand: Number(u.rtp_modifier) > 1.15 ? "Boosted" : Number(u.rtp_modifier) < 0.9 ? "Conservative" : "Standard"
      })));

      setUserLabel(data.user.email?.split("@")[0] || "Operator");
      setAuthLoading(false);
      await loadPendingTransactions();
    }

    void bootAdmin();

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

  const pendingCount = useMemo(
    () => transactions.filter((item) => item.status === "pending").length,
    [transactions]
  );

  const approvedVolume = useMemo(
    () =>
      transactions
        .filter((item) => item.status === "approved")
        .reduce((sum, item) => sum + item.amount, 0),
    [transactions]
  );

  const averageRtpModifier = useMemo(() => {
    if (users.length === 0) return 1;

    const total = users.reduce((sum, user) => sum + user.rtpModifier, 0);
    return total / users.length;
  }, [users]);

async function updateTransactionStatus(
  transactionId: string,
  nextStatus: TransactionResolution
) {
    const target = transactions.find((item) => item.id === transactionId);

    if (!target || target.status !== "pending") return;

    setResolvingTransactionId(transactionId);
    setStatusText(`Resolving transaction ${transactionId}...`);

    try {
      const result = await resolveTransaction(
        transactionId,
        target.userId,
        target.type,
        target.amount,
        nextStatus
      );

      if (!result.ok) {
        setStatusText(result.error || "Transaction resolution failed.");
        return;
      }

      setTransactions((current) =>
        current.map((item) =>
          item.id === transactionId ? { ...item, status: nextStatus } : item
        )
      );

      setStatusText(`Transaction ${transactionId} marked as ${nextStatus}.`);
    } catch {
      setStatusText("Transaction resolution failed.");
    } finally {
      setResolvingTransactionId(null);
    }
  }

  function updateRtpModifier(userId: string, nextValue: number) {
    setUsers((current) =>
      current.map((user) =>
        user.id === userId
          ? {
              ...user,
              rtpModifier: nextValue,
              riskBand:
                nextValue > 1.15
                  ? "Boosted"
                  : nextValue < 0.9
                    ? "Conservative"
                    : "Standard",
            }
          : user
      )
    );
  }

  async function saveRtpModifier(user: UserControlRow) {
    setSavingUserId(user.id);
    setStatusText(`Saving ${user.player}...`);
    
    const result = await updatePlayerRTP(user.id, user.rtpModifier);
    
    setStatusText(result.ok ? `Successfully updated ${user.player} RTP.` : "Error updating RTP.");
    setSavingUserId(null);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/auth");
  }

  if (authLoading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#050505] px-6 text-white">
        <div className="rounded-[2rem] border border-[#FFD700]/20 bg-white/[0.05] p-8 text-center shadow-[0_0_80px_rgba(255,215,0,0.08)] backdrop-blur-xl">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[#FFD700]/30 border-t-[#FFD700]" />
          <div className="font-mono text-[10px] font-black uppercase tracking-[0.24em] text-[#FFD700]/70">
            Loading Admin Console
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh overflow-x-hidden bg-[#050505] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-[-16rem] h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-[#8B0000]/35 blur-[140px]" />
        <div className="absolute bottom-[-18rem] right-[-14rem] h-[34rem] w-[34rem] rounded-full bg-[#FFD700]/10 blur-[140px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:36px_36px] opacity-35" />
      </div>

      <section className="relative mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.58)] backdrop-blur-xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => router.push("/lobby")}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-white/50 transition hover:border-[#FFD700]/30 hover:text-[#FFD700]"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Lobby
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/pitch")}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-white/50 transition hover:border-[#FFD700]/30 hover:text-[#FFD700]"
                >
                  <Terminal className="h-3.5 w-3.5" />
                  Pitch
                </button>

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
                <ShieldCheck className="h-3.5 w-3.5" />
                Secure Operator Console
              </div>

              <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-white sm:text-5xl">
                Nagani Admin
              </h1>

              <p className="mt-3 max-w-3xl font-mono text-xs leading-6 text-white/45 sm:text-sm">
                Control panel for transaction review and simulation risk
                controls. Transaction approval is now connected to the live
                ledger action flow.
              </p>
            </div>

            <div className="rounded-2xl border border-[#FFD700]/20 bg-[#FFD700]/[0.06] p-4 lg:w-[22rem]">
              <div className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-[#FFD700]/70">
                Operator
              </div>

              <div className="mt-2 truncate text-xl font-black text-white">
                {userLabel}
              </div>

              <div className="mt-3 flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 font-mono text-[9px] font-black uppercase tracking-[0.18em] text-emerald-200">
                <LockKeyhole className="h-3.5 w-3.5" />
                Authenticated Session
              </div>
            </div>
          </div>
        </header>

        <section className="mt-5 grid gap-4 md:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[1.5rem] border border-[#FFD700]/20 bg-[#FFD700]/[0.055] p-5 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between">
              <WalletCards className="h-5 w-5 text-[#FFD700]" />
              <span className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                Queue
              </span>
            </div>

            <div className="mt-4 font-mono text-3xl font-black text-white">
              {transactionsLoading ? "..." : pendingCount}
            </div>

            <div className="mt-1 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#FFD700]/75">
              Pending Transactions
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            className="rounded-[1.5rem] border border-emerald-400/20 bg-emerald-400/[0.055] p-5 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between">
              <Coins className="h-5 w-5 text-emerald-200" />
              <span className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                Approved
              </span>
            </div>

            <div className="mt-4 font-mono text-3xl font-black text-white">
              {formatMoney(approvedVolume)}
            </div>

            <div className="mt-1 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200/75">
              Approved Volume
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="rounded-[1.5rem] border border-red-400/20 bg-red-500/[0.055] p-5 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between">
              <Gauge className="h-5 w-5 text-red-100" />
              <span className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                Scenario
              </span>
            </div>

            <div className="mt-4 font-mono text-3xl font-black text-white">
              {averageRtpModifier.toFixed(2)}x
            </div>

            <div className="mt-1 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-red-100/75">
              Avg RTP Modifier
            </div>
          </motion.div>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.5)] backdrop-blur-xl"
          >
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-[0.24em] text-[#FFD700]/70">
                  <WalletCards className="h-4 w-4" />
                  Transaction Approval
                </div>

                <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
                  Pending Banking Requests
                </h2>
              </div>

              <button
                type="button"
                onClick={loadPendingTransactions}
                disabled={transactionsLoading}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-4 py-2 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-white/50 transition hover:border-[#FFD700]/30 hover:text-[#FFD700] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${
                    transactionsLoading ? "animate-spin" : ""
                  }`}
                />
                Refresh
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left">
                  <thead className="bg-white/[0.06]">
                    <tr className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
                      <th className="px-4 py-3">Ticket</th>
                      <th className="px-4 py-3">Player</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Method</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {transactionsLoading ? (
                      <tr className="border-t border-white/10 bg-black/20">
                        <td
                          colSpan={7}
                          className="px-4 py-10 text-center font-mono text-xs font-black uppercase tracking-[0.2em] text-white/35"
                        >
                          Syncing transaction queue...
                        </td>
                      </tr>
                    ) : transactions.length === 0 ? (
                      <tr className="border-t border-white/10 bg-black/20">
                        <td
                          colSpan={7}
                          className="px-4 py-10 text-center font-mono text-xs font-black uppercase tracking-[0.2em] text-white/35"
                        >
                          No pending banking requests.
                        </td>
                      </tr>
                    ) : (
                      transactions.map((transaction) => {
                        const isResolving =
                          resolvingTransactionId === transaction.id;

                        return (
                          <tr
                            key={transaction.id}
                            className="border-t border-white/10 bg-black/20 text-sm text-white/65 transition hover:bg-white/[0.035]"
                          >
                            <td className="px-4 py-4 font-mono text-white/55">
                              {transaction.id}
                            </td>

                            <td className="px-4 py-4 font-semibold text-white/75">
                              {transaction.player}
                            </td>

                            <td className="px-4 py-4 capitalize">
                              {transaction.type}
                            </td>

                            <td className="px-4 py-4 font-mono font-black text-[#FFD700]">
                              {formatMoney(transaction.amount)}
                            </td>

                            <td className="px-4 py-4 text-white/55">
                              {transaction.method}
                            </td>

                            <td className="px-4 py-4">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 font-mono text-[9px] font-black uppercase tracking-[0.16em] ${getStatusVisual(
                                  transaction.status
                                )}`}
                              >
                                {transaction.status}
                              </span>
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateTransactionStatus(
                                      transaction.id,
                                      "approved"
                                    )
                                  }
                                  disabled={
                                    transaction.status !== "pending" ||
                                    isResolving
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-200 transition disabled:cursor-not-allowed disabled:opacity-35"
                                >
                                  {isResolving ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                  )}
                                  Approve
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    updateTransactionStatus(
                                      transaction.id,
                                      "rejected"
                                    )
                                  }
                                  disabled={
                                    transaction.status !== "pending" ||
                                    isResolving
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-full border border-red-400/25 bg-red-400/10 px-3 py-1.5 text-xs font-bold text-red-200 transition disabled:cursor-not-allowed disabled:opacity-35"
                                >
                                  {isResolving ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <XCircle className="h-3.5 w-3.5" />
                                  )}
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.5)] backdrop-blur-xl"
          >
            <div className="mb-5">
              <div className="flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-[0.24em] text-[#FFD700]/70">
                <SlidersHorizontal className="h-4 w-4" />
                User Simulation Control
              </div>

              <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
                RTP Scenario Modifier
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/45">
                Demo-only risk control for PM presentation. Backend should
                enforce audit logs and role permissions before production use.
              </p>
            </div>

            <div className="space-y-4">
              {users.map((user) => {
                const tone = getRtpTone(user.rtpModifier);
                const isSaving = savingUserId === user.id;

                return (
                  <div
                    key={user.id}
                    className="rounded-[1.5rem] border border-white/10 bg-black/25 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <UserCog className="h-4 w-4 text-[#FFD700]" />
                          <h3 className="font-black text-white">
                            {user.player}
                          </h3>
                        </div>

                        <div className="mt-1 font-mono text-[9px] font-black uppercase tracking-[0.18em] text-white/35">
                          {user.id} · {user.room}
                        </div>
                      </div>

                      <div
                        className={`rounded-full border px-3 py-1 font-mono text-[8px] font-black uppercase tracking-[0.16em] ${tone.border} ${tone.bg} ${tone.text}`}
                      >
                        {user.riskBand}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                        <div className="font-mono text-[9px] font-black uppercase tracking-[0.18em] text-white/30">
                          Balance
                        </div>

                        <div className="mt-1 font-mono text-lg font-black text-white">
                          {formatMoney(user.playableBalance)}
                        </div>
                      </div>

                      <div
                        className={`rounded-2xl border p-3 ${tone.border} ${tone.bg}`}
                      >
                        <div className="font-mono text-[9px] font-black uppercase tracking-[0.18em] text-white/35">
                          Modifier
                        </div>

                        <div
                          className={`mt-1 font-mono text-lg font-black ${tone.text}`}
                        >
                          {user.rtpModifier.toFixed(2)}x
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between font-mono text-[9px] font-black uppercase tracking-[0.16em] text-white/35">
                        <span>0.50x</span>
                        <span>{tone.label}</span>
                        <span>2.00x</span>
                      </div>

                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.05"
                        value={user.rtpModifier}
                        onChange={(event) =>
                          updateRtpModifier(user.id, Number(event.target.value))
                        }
                        className="w-full accent-[#FFD700]"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => saveRtpModifier(user)}
                      disabled={isSaving}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-[1.25rem] border border-[#FFD700]/25 bg-[#FFD700]/10 px-4 py-3 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#FFD700] transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Gauge className="h-4 w-4" />
                      )}
                      {isSaving ? "Saving" : "Save Scenario"}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-200" />

                <p className="text-xs leading-5 text-red-100/70">
                  This panel is presented as a simulation and risk-modeling
                  control for the interview prototype. Production usage requires
                  legal review, transparent policies, strict role control, and
                  auditable server-side logging.
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        <AnimatePresence>
          {statusText && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="mt-5 rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-xs text-white/45 backdrop-blur-xl"
            >
              <div className="flex items-center gap-2">
                <Layers3 className="h-4 w-4 text-[#FFD700]" />
                {statusText}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </main>
  );
}