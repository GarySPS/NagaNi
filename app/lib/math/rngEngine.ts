//app>lib>math>rngEngine.ts
export type VolatilityProfile = {
  name: string;
  hitRate: number;      // 0 to 100
  nearMissRate: number; // 0 to 100
  multipliers: Record<string, number>;
};

export const ROOM_PROFILES: Record<string, VolatilityProfile> = {
  "Green Valley": { // Beginner Room
    name: "Green Valley",
    hitRate: 35.0, 
    nearMissRate: 15.0,
    multipliers: { dragon: 20, tiger: 10, koi: 5, lotus: 3, coin: 1.5 }
  },
  "Golden Buffalo": { // Standard Room
    name: "Golden Buffalo",
    hitRate: 22.0,
    nearMissRate: 25.0,
    multipliers: { dragon: 100, tiger: 40, koi: 20, lotus: 10, coin: 5 }
  },
  "Dragon's Peak": { // High Roller Room
    name: "Dragon's Peak",
    hitRate: 8.0, 
    nearMissRate: 40.0, // High suspense for low hits
    multipliers: { dragon: 1000, tiger: 200, koi: 100, lotus: 50, coin: 20 }
  }
};

// Updated executeSpin to accept a room name
export async function executeSpin(betAmount: number, roomName: string = "Golden Buffalo") {
  const profile = ROOM_PROFILES[roomName];
  const roll = Math.random() * 100;
  
  if (roll <= profile.hitRate) {
    const symbols = Object.keys(profile.multipliers);
    const winSymbol = symbols[Math.floor(Math.random() * symbols.length)];
    return {
      isWin: true,
      payout: betAmount * profile.multipliers[winSymbol],
      isNearMiss: false,
      finalReels: [winSymbol, winSymbol, winSymbol]
    };
  }

  const nearMissRoll = Math.random() * 100;
  if (nearMissRoll <= profile.nearMissRate) {
    return { isWin: false, payout: 0, isNearMiss: true, finalReels: ['dragon', 'dragon', 'lotus'] };
  }

  return { isWin: false, payout: 0, isNearMiss: false, finalReels: ['koi', 'tiger', 'coin'] };
}