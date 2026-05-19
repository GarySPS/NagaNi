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
  const result = await executeSpin(betAmount, roomName);
  const vaultAddition = betAmount * 0.10;

  await supabaseAdmin.from("spin_logs").insert({
    user_id: userId,
    bet_amount: betAmount,
    win_amount: result.payout,
    is_near_miss: result.isNearMiss,
    room_name: roomName,
  });

  const { data: wallet } = await supabaseAdmin.from('wallets').select('*').eq('id', userId).single();
  
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