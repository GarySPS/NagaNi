"use server";

import { createClient } from '@supabase/supabase-js';
import { executeSpin } from './math/rngEngine';

// Helper function to safely instantiate the admin client inside the actions
// This prevents Next.js from throwing the "found object" error on the server
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function playSpin(userId: string, betAmount: number, roomName: string = "Golden Buffalo") {
  const supabaseAdmin = getAdminClient();

  // 1. Fetch the user's wallet FIRST to get their specific RTP modifier
  const { data: wallet } = await supabaseAdmin.from('wallets').select('*').eq('id', userId).single();
  
  // Default to standard 1.0 odds if not found
  const rtpModifier = wallet?.rtp_modifier ? Number(wallet.rtp_modifier) : 1.0;

  // 2. Pass the modifier into the math engine
  const result = await executeSpin(betAmount, roomName, rtpModifier);
  const vaultAddition = betAmount * 0.10;

  await supabaseAdmin.from("spin_logs").insert({
    user_id: userId,
    bet_amount: betAmount,
    win_amount: result.payout,
    is_near_miss: result.isNearMiss,
    room_name: roomName,
  });
  
  if (wallet) {
    await supabaseAdmin.from('wallets').update({
      playable_balance: wallet.playable_balance - betAmount + result.payout,
      locked_vault: wallet.locked_vault + vaultAddition
    }).eq('id', userId);
  }

  return result;
}

export async function getWallet(userId: string) {
  const supabaseAdmin = getAdminClient();
  const { data, error } = await supabaseAdmin
    .from('wallets')
    .select('playable_balance, locked_vault')
    .eq('id', userId)
    .single();

  if (error || !data) {
    console.error("Wallet fetch error:", error);
    return { playable_balance: 0, locked_vault: 0 };
  }
  
  return data;
}

export async function getDashboardStats(userId: string) {
  const supabaseAdmin = getAdminClient();
  const { data: logs, error } = await supabaseAdmin
    .from('spin_logs')
    .select('bet_amount, win_amount, is_near_miss, room_name, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !logs) {
    console.error("Stats fetch error:", error);
    return { totalSpins: 0, totalTurnover: 0, ggr: 0, roomStats: {}, recentLogs: [] };
  }

  let totalTurnover = 0;
  let totalWins = 0;
  
  const roomStats: Record<string, { spins: number, turnover: number, wins: number, ggr: number }> = {
    "Green Valley": { spins: 0, turnover: 0, wins: 0, ggr: 0 },
    "Golden Buffalo": { spins: 0, turnover: 0, wins: 0, ggr: 0 },
    "Dragon's Peak": { spins: 0, turnover: 0, wins: 0, ggr: 0 }
  };

  logs.forEach(log => {
    const bet = Number(log.bet_amount);
    const win = Number(log.win_amount);
    const room = log.room_name || "Golden Buffalo";

    totalTurnover += bet;
    totalWins += win;

    if (roomStats[room]) {
      roomStats[room].spins += 1;
      roomStats[room].turnover += bet;
      roomStats[room].wins += win;
      roomStats[room].ggr += (bet - win);
    }
  });

  const ggr = totalTurnover - totalWins; 

  return {
    totalSpins: logs.length,
    totalTurnover,
    ggr,
    roomStats,
    recentLogs: logs.slice(0, 10)
  };
}

export async function triggerMidnightUnlock() {
  const supabaseAdmin = getAdminClient();
  const { error } = await supabaseAdmin.rpc('process_daily_bonus_unlock');
  if (error) console.error("Midnight unlock error:", error);
  return !error;
}

export async function fundWallet(userId: string, amount: number) {
  const supabaseAdmin = getAdminClient();
  const { error } = await supabaseAdmin.rpc('admin_fund_wallet', { 
    target_user_id: userId, 
    amount: amount 
  });
  
  if (error) {
    console.error("LiveOps Funding Error:", error);
    return false;
  }
  return true;
}

export type WalletRequestType = "deposit" | "withdraw";
export type WalletRequestStatus = "pending" | "approved" | "rejected";

export type WalletRequestTicket = {
  id: string;
  user_id: string;
  type: WalletRequestType;
  amount: number;
  status: WalletRequestStatus;
  created_at: string;
};

export type SubmitWalletRequestResult =
  | { ok: true; ticket: WalletRequestTicket }
  | { ok: false; error: string };

function mapWalletRequestRow(row: any): WalletRequestTicket {
  return {
    id: row.id,
    user_id: row.user_id,
    type: row.type === "withdraw" ? "withdraw" : "deposit",
    amount: Number(row.amount || 0),
    status: ["approved", "rejected"].includes(row.status) ? row.status : "pending",
    created_at: row.created_at,
  };
}

export async function getWalletRequests(userId: string): Promise<WalletRequestTicket[]> {
  if (!userId) return [];
  const supabaseAdmin = getAdminClient();

  // Updated to point to the new 'transactions' ledger
  const { data, error } = await supabaseAdmin
.from("transactions")
.select("id, user_id, type, amount, status, created_at")
.eq("user_id", userId)
.in("type", ["deposit", "withdraw"])
.order("created_at", { ascending: false })
.limit(10);

  if (error || !data) return [];
  return data.map(mapWalletRequestRow);
}

export async function submitWalletRequest(
  userId: string,
  type: WalletRequestType,
  amount: number
): Promise<SubmitWalletRequestResult> {
  const safeAmount = Number(amount);

  if (!userId) return { ok: false, error: "Session expired. Please sign in again." };
  if (!Number.isFinite(safeAmount) || safeAmount <= 0) return { ok: false, error: "Enter a valid amount." };

  if (type === "withdraw") {
    const wallet = await getWallet(userId);
    if (safeAmount > Number(wallet?.playable_balance ?? 0)) {
      return { ok: false, error: "Withdraw amount cannot exceed playable balance." };
    }
  }

  const supabaseAdmin = getAdminClient();

  // Updated to point to the new 'transactions' ledger
  const { data, error } = await supabaseAdmin
    .from("transactions")
    .insert({ user_id: userId, type, amount: safeAmount, status: "pending" })
    .select("id, user_id, type, amount, status, created_at")
    .single();

  if (error || !data) return { ok: false, error: "Database transaction failed." };
  
  return { ok: true, ticket: mapWalletRequestRow(data) };
}

// ==========================================
// PHASE 4.2: ADMIN GOD-MODE ACTIONS
// ==========================================

export async function checkIsAdmin(userId: string): Promise<boolean> {
  if (!userId) return false;
  const supabaseAdmin = getAdminClient();
  const { data } = await supabaseAdmin
    .from("wallets")
    .select("is_admin")
    .eq("id", userId)
    .single();
    
  return !!data?.is_admin;
}

export async function getAllPendingTransactions() {
  const supabaseAdmin = getAdminClient();
const { data, error } = await supabaseAdmin
  .from("transactions")
  .select("id, user_id, type, amount, status, created_at")
  .eq("status", "pending")
  .in("type", ["deposit", "withdraw"])
  .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch pending transactions:", error);
    return [];
  }
  return data;
}

export async function resolveTransaction(transactionId: string, userId: string, type: "deposit" | "withdraw", amount: number, resolution: "approved" | "rejected") {
  const supabaseAdmin = getAdminClient();

  // 1. Update the transaction status
  const { error: txError } = await supabaseAdmin
    .from("transactions")
    .update({ status: resolution })
    .eq("id", transactionId);

  if (txError) return { ok: false, error: "Failed to update transaction status." };

  // 2. If approved, modify the actual wallet balance
  if (resolution === "approved") {
    const { data: wallet } = await supabaseAdmin
      .from("wallets")
      .select("playable_balance")
      .eq("id", userId)
      .single();

    if (wallet) {
      const currentBalance = Number(wallet.playable_balance || 0);
      const newBalance = type === "deposit" ? currentBalance + amount : currentBalance - amount;

      await supabaseAdmin
        .from("wallets")
        .update({ playable_balance: newBalance })
        .eq("id", userId);
    }
  }

  return { ok: true };
}

export async function updatePlayerRTP(targetUserId: string, newRtpModifier: number) {
  const supabaseAdmin = getAdminClient();
  const { error } = await supabaseAdmin
    .from("wallets")
    .update({ rtp_modifier: newRtpModifier })
    .eq("id", targetUserId);

  if (error) return { ok: false, error: "Failed to update RTP modifier." };
  return { ok: true };
}

export async function getPlayerList() {
  const supabaseAdmin = getAdminClient();
  const { data, error } = await supabaseAdmin
    .from("wallets")
    .select("id, playable_balance, rtp_modifier");
  if (error) return [];
  return data;
}