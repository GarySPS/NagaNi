//app/lib/actions.ts

"use server";

import { supabase } from './supabase';
import { executeSpin } from './math/rngEngine';

export async function playSpin(userId: string, betAmount: number, roomName: string = "Golden Buffalo") {
  // 1. Run the Math Engine (Now awaiting the async call and passing the room)
  const result = await executeSpin(betAmount, roomName);

  // 2. Calculate the "Tomorrow Bonus" (10% of the bet goes to the vault)
  const vaultAddition = betAmount * 0.10;

  // 3. Log the spin for your PM Dashboard
await supabase.from("spin_logs").insert({
  user_id: userId,
  bet_amount: betAmount,
  win_amount: result.payout,
  is_near_miss: result.isNearMiss,
  room_name: roomName,
});

  // 4. Update the Wallet (Deduct bet, add win, add to vault)
  const { data: wallet } = await supabase.from('wallets').select('*').eq('id', userId).single();
  
  if (wallet) {
    await supabase.from('wallets').update({
      playable_balance: wallet.playable_balance - betAmount + result.payout,
      locked_vault: wallet.locked_vault + vaultAddition
    }).eq('id', userId);
  }

  return result;
}

export async function getWallet(userId: string) {
  const { data, error } = await supabase
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
  const { data: logs, error } = await supabase
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
  // This calls the Postgres RPC function we created in Chapter 1
  const { error } = await supabase.rpc('process_daily_bonus_unlock');
  if (error) console.error("Midnight unlock error:", error);
  return !error;
}

export async function fundWallet(userId: string, amount: number) {
  const { error } = await supabase.rpc('admin_fund_wallet', { 
    target_user_id: userId, 
    amount: amount 
  });
  
  if (error) {
    console.error("LiveOps Funding Error:", error);
    return false;
  }
  return true;
}