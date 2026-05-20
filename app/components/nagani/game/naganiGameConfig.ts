export const BET_AMOUNT = 25;

export const ROTATE_HINT_STORAGE_KEY =
  "nagani_rotate_hint_do_not_show_v1";

export type RoomName = "Green Valley" | "Golden Buffalo" | "Dragon's Peak";

export function resolveRoomName(value: string | null): RoomName {
  if (
    value === "Green Valley" ||
    value === "Golden Buffalo" ||
    value === "Dragon's Peak"
  ) {
    return value;
  }

  return "Golden Buffalo";
}

export function getRoomSkin(roomName: RoomName) {
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

export function formatCredits(value: number) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}