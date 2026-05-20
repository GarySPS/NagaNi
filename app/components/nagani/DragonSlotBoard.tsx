//app>components>nagani>DragonSLotBoard.tsx

"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useRef } from "react";
import type { ReelSymbolKey } from "./SlotReel";

type ExtraSymbolKey =
  | "ten"
  | "a"
  | "k"
  | "q"
  | "j"
  | "jade"
  | "firepearl";

type DisplaySymbolKey = ReelSymbolKey | ExtraSymbolKey;

type BoardCell = {
  key: DisplaySymbolKey;
  locked?: boolean;
};

type DragonSlotBoardProps = {
  finalReels: ReelSymbolKey[];
  isSpinning: boolean;
  isNearMiss?: boolean;
  spinKey: number;
  onStop: () => void;
};

const REEL_COUNT = 5;
const VISIBLE_ROWS = 3;
const ITEM_HEIGHT = 96;

const SYMBOL_DECK: DisplaySymbolKey[] = [
  "dragon",
  "ruby",
  "gold",
  "coin",
  "chinthe",
  "lotus",
  "jade",
  "firepearl",
  "tiger",
  "koi",
  "a",
  "k",
  "q",
  "j",
  "ten",
];

const SYMBOLS: Record<
  DisplaySymbolKey,
  {
    label: string;
    shortLabel: string;
    assetSrc: string | null;
    placeholder: string;
    glow: string;
  }
> = {
  dragon: {
    label: "Red Dragon",
    shortLabel: "DRG",
    assetSrc: null,
    placeholder: "bg-gradient-to-br from-red-600 via-red-950 to-black",
    glow: "shadow-[0_0_28px_rgba(239,68,68,0.55)]",
  },
  ruby: {
    label: "Ruby",
    shortLabel: "RBY",
    assetSrc: null,
    placeholder: "bg-gradient-to-br from-rose-400 via-red-800 to-black",
    glow: "shadow-[0_0_24px_rgba(244,63,94,0.45)]",
  },
  gold: {
    label: "Gold Bar",
    shortLabel: "GLD",
    assetSrc: null,
    placeholder: "bg-gradient-to-br from-yellow-200 via-amber-600 to-black",
    glow: "shadow-[0_0_26px_rgba(250,204,21,0.5)]",
  },
  coin: {
    label: "Gold Coin",
    shortLabel: "COIN",
    assetSrc: null,
    placeholder: "bg-gradient-to-br from-amber-200 via-yellow-700 to-black",
    glow: "shadow-[0_0_24px_rgba(251,191,36,0.45)]",
  },
  chinthe: {
    label: "Chinthe",
    shortLabel: "CHIN",
    assetSrc: null,
    placeholder: "bg-gradient-to-br from-orange-300 via-amber-800 to-black",
    glow: "shadow-[0_0_22px_rgba(251,146,60,0.42)]",
  },
  lotus: {
    label: "Lotus",
    shortLabel: "LOT",
    assetSrc: null,
    placeholder: "bg-gradient-to-br from-pink-300 via-rose-800 to-black",
    glow: "shadow-[0_0_22px_rgba(244,114,182,0.4)]",
  },
  jade: {
    label: "Jade",
    shortLabel: "JDE",
    assetSrc: null,
    placeholder: "bg-gradient-to-br from-emerald-300 via-green-800 to-black",
    glow: "shadow-[0_0_22px_rgba(52,211,153,0.42)]",
  },
  firepearl: {
    label: "Fire Pearl",
    shortLabel: "FIRE",
    assetSrc: null,
    placeholder: "bg-gradient-to-br from-orange-300 via-red-700 to-black",
    glow: "shadow-[0_0_24px_rgba(249,115,22,0.5)]",
  },
  tiger: {
    label: "Tiger",
    shortLabel: "TGR",
    assetSrc: null,
    placeholder: "bg-gradient-to-br from-orange-400 via-red-900 to-black",
    glow: "shadow-[0_0_20px_rgba(251,146,60,0.35)]",
  },
  koi: {
    label: "Koi",
    shortLabel: "KOI",
    assetSrc: null,
    placeholder: "bg-gradient-to-br from-cyan-300 via-blue-900 to-black",
    glow: "shadow-[0_0_20px_rgba(34,211,238,0.34)]",
  },
  pattern: {
    label: "Pattern",
    shortLabel: "PAT",
    assetSrc: null,
    placeholder: "bg-gradient-to-br from-zinc-500 via-zinc-900 to-black",
    glow: "shadow-[0_0_18px_rgba(255,255,255,0.14)]",
  },
  ten: {
    label: "Ten",
    shortLabel: "10",
    assetSrc: null,
    placeholder: "bg-gradient-to-br from-red-500 via-red-950 to-black",
    glow: "shadow-[0_0_18px_rgba(239,68,68,0.3)]",
  },
  a: {
    label: "Ace",
    shortLabel: "A",
    assetSrc: null,
    placeholder: "bg-gradient-to-br from-pink-400 via-red-900 to-black",
    glow: "shadow-[0_0_18px_rgba(244,114,182,0.3)]",
  },
  k: {
    label: "King",
    shortLabel: "K",
    assetSrc: null,
    placeholder: "bg-gradient-to-br from-yellow-300 via-amber-900 to-black",
    glow: "shadow-[0_0_18px_rgba(250,204,21,0.34)]",
  },
  q: {
    label: "Queen",
    shortLabel: "Q",
    assetSrc: null,
    placeholder: "bg-gradient-to-br from-emerald-300 via-green-900 to-black",
    glow: "shadow-[0_0_18px_rgba(52,211,153,0.3)]",
  },
  j: {
    label: "Jack",
    shortLabel: "J",
    assetSrc: null,
    placeholder: "bg-gradient-to-br from-cyan-300 via-sky-900 to-black",
    glow: "shadow-[0_0_18px_rgba(34,211,238,0.3)]",
  },
};

function normalizeSymbol(symbol: string | undefined | null): DisplaySymbolKey {
  const key = String(symbol || "").toLowerCase() as DisplaySymbolKey;
  return SYMBOLS[key] ? key : "pattern";
}

function seededSymbol(seed: number, avoid: DisplaySymbolKey[] = []) {
  const safeDeck = SYMBOL_DECK.filter((symbol) => !avoid.includes(symbol));
  const index = Math.abs(seed * 9301 + 49297) % safeDeck.length;

  return safeDeck[index];
}

function hasThreeMatch(row: DisplaySymbolKey[]) {
  for (let index = 0; index <= row.length - 3; index += 1) {
    const slice = row.slice(index, index + 3);

    if (slice.every((symbol) => symbol === slice[0])) {
      return true;
    }
  }

  return false;
}

function buildSafeDummyRow(
  spinKey: number,
  rowIndex: number,
  middleBackend: DisplaySymbolKey[]
) {
  let attempt = 0;

  while (attempt < 30) {
    const row = Array.from({ length: REEL_COUNT }, (_, columnIndex) =>
      seededSymbol(spinKey + rowIndex * 101 + columnIndex * 17 + attempt)
    );

    const middleThreeMatchesBackend =
      row[1] === middleBackend[0] &&
      row[2] === middleBackend[1] &&
      row[3] === middleBackend[2];

    if (!hasThreeMatch(row) && !middleThreeMatchesBackend) {
      return row;
    }

    attempt += 1;
  }

  return [
    seededSymbol(spinKey + rowIndex + 1, [middleBackend[0]]),
    seededSymbol(spinKey + rowIndex + 2, [middleBackend[0]]),
    seededSymbol(spinKey + rowIndex + 3, [middleBackend[1]]),
    seededSymbol(spinKey + rowIndex + 4, [middleBackend[2]]),
    seededSymbol(spinKey + rowIndex + 5, [middleBackend[2]]),
  ];
}

function buildFinalGrid(finalReels: ReelSymbolKey[], spinKey: number) {
  const backendMiddle: DisplaySymbolKey[] = [
    normalizeSymbol(finalReels[0]),
    normalizeSymbol(finalReels[1]),
    normalizeSymbol(finalReels[2]),
  ];

  const topRow = buildSafeDummyRow(spinKey, 0, backendMiddle);
  const bottomRow = buildSafeDummyRow(spinKey, 2, backendMiddle);

  const leftMiddle = seededSymbol(spinKey + 701, [backendMiddle[0]]);
  const rightMiddle = seededSymbol(spinKey + 907, [backendMiddle[2]]);

  const middleRow: DisplaySymbolKey[] = [
    leftMiddle,
    backendMiddle[0],
    backendMiddle[1],
    backendMiddle[2],
    rightMiddle,
  ];

  return Array.from({ length: REEL_COUNT }, (_, columnIndex) => [
    {
      key: topRow[columnIndex],
      locked: false,
    },
    {
      key: middleRow[columnIndex],
      locked: columnIndex >= 1 && columnIndex <= 3,
    },
    {
      key: bottomRow[columnIndex],
      locked: false,
    },
  ]);
}

function buildReelTrack(
  finalColumn: BoardCell[],
  columnIndex: number,
  spinKey: number
) {
  const fillerCount = 18 + columnIndex * 5;

  const filler = Array.from({ length: fillerCount }, (_, index) => ({
    key: seededSymbol(spinKey + columnIndex * 313 + index * 19),
    locked: false,
  }));

  return [...filler, ...finalColumn];
}

function SymbolTile({
  cell,
  isFinalPayline,
}: {
  cell: BoardCell;
  isFinalPayline: boolean;
}) {
  const symbol = SYMBOLS[cell.key];

  return (
    <div
      className={`relative flex h-[5.15rem] w-full items-center justify-center overflow-hidden rounded-[1rem] border ${
        isFinalPayline
          ? "border-[#FFD700]/90 ring-1 ring-[#FFD700]/70"
          : "border-white/10"
      } ${symbol.placeholder} ${symbol.glow}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.22),transparent_36%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/72 to-transparent" />
      <div className="pointer-events-none absolute inset-0 rounded-[1rem] ring-1 ring-inset ring-white/[0.045]" />

      {symbol.assetSrc ? (
        <img
          src={symbol.assetSrc}
          alt={symbol.label}
          className="relative z-10 h-[78%] w-[78%] object-contain drop-shadow-[0_12px_18px_rgba(0,0,0,0.65)]"
          draggable={false}
        />
      ) : (
        <div className="relative z-10 flex h-[74%] w-[74%] items-center justify-center rounded-[0.85rem] border border-white/15 bg-black/28 shadow-[inset_0_0_24px_rgba(0,0,0,0.42)]">
          <div className="text-center">
            <div className="font-mono text-[0.82rem] font-black uppercase tracking-[0.16em] text-white">
              {symbol.shortLabel}
            </div>
            <div className="mt-1 font-mono text-[0.42rem] font-black uppercase tracking-[0.18em] text-white/48">
              Asset Slot
            </div>
          </div>
        </div>
      )}

      {isFinalPayline && (
        <div className="pointer-events-none absolute inset-0 rounded-[1rem] bg-[#FFD700]/[0.07]" />
      )}
    </div>
  );
}

export default function DragonSlotBoard({
  finalReels,
  isSpinning,
  isNearMiss,
  spinKey,
  onStop,
}: DragonSlotBoardProps) {
  const onStopRef = useRef(onStop);

  useEffect(() => {
    onStopRef.current = onStop;
  }, [onStop]);

  const finalGrid = useMemo(
    () => buildFinalGrid(finalReels, spinKey),
    [finalReels, spinKey]
  );

  const reels = useMemo(
    () =>
      finalGrid.map((finalColumn, columnIndex) =>
        buildReelTrack(finalColumn, columnIndex, spinKey)
      ),
    [finalGrid, spinKey]
  );

  useEffect(() => {
    if (!isSpinning) return;

    const timers = [950, 1220, 1510, 1840, 2260].map((delay) =>
      window.setTimeout(() => {
        onStopRef.current();
      }, delay)
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [isSpinning, spinKey]);

  return (
    <div className="relative overflow-hidden rounded-[2.35rem] border border-[#FFD700]/50 bg-gradient-to-b from-[#aa2a0a] via-[#2a0505] to-black p-2.5 shadow-[inset_0_0_48px_rgba(0,0,0,0.9),0_0_64px_rgba(250,204,21,0.2)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(250,204,21,0.28),transparent_42%)]" />
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/90 to-transparent" />

      <div className="relative rounded-[2rem] border border-[#FFD700]/30 bg-gradient-to-b from-[#210505] via-[#070101] to-black p-2.5 shadow-[inset_0_0_44px_rgba(0,0,0,0.94)]">
        <div className="pointer-events-none absolute inset-x-5 top-1/2 z-40 h-[2px] -translate-y-1/2 bg-gradient-to-r from-transparent via-[#FFD700] to-transparent opacity-95 shadow-[0_0_28px_rgba(250,204,21,1)]" />
        <div className="pointer-events-none absolute inset-x-5 top-[33.33%] z-30 h-px bg-white/[0.07]" />
        <div className="pointer-events-none absolute inset-x-5 top-[66.66%] z-30 h-px bg-white/[0.07]" />

        <div className="pointer-events-none absolute left-1 top-7 bottom-7 z-40 flex flex-col justify-between rounded-full border border-[#FFD700]/35 bg-black/85 px-1 py-2 font-mono text-[7px] font-black text-[#FFD700]/85">
          <span>5</span>
          <span>1</span>
          <span>9</span>
        </div>

        <div className="pointer-events-none absolute right-1 top-7 bottom-7 z-40 flex flex-col justify-between rounded-full border border-[#FFD700]/35 bg-black/85 px-1 py-2 font-mono text-[7px] font-black text-[#FFD700]/85">
          <span>15</span>
          <span>25</span>
          <span>10</span>
        </div>

        <div className="relative grid grid-cols-5 gap-1.5 rounded-[1.55rem] border border-[#FFD700]/20 bg-black/92 p-2 shadow-[inset_0_0_38px_rgba(0,0,0,0.95)]">
          <div className="pointer-events-none absolute inset-0 z-20 rounded-[1.55rem] bg-gradient-to-b from-white/[0.07] via-transparent to-black/38" />
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-10 rounded-t-[1.55rem] bg-gradient-to-b from-black/70 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-10 rounded-b-[1.55rem] bg-gradient-to-t from-black/75 to-transparent" />

          {reels.map((track, columnIndex) => {
            const targetY =
              -1 * (track.length - VISIBLE_ROWS) * ITEM_HEIGHT;

            const isDramaReel = Boolean(isNearMiss && columnIndex === 3);
            const duration =
              1.05 + columnIndex * 0.22 + (isDramaReel ? 0.85 : 0);

            return (
              <div
                key={`asset-reel-${columnIndex}`}
                className="relative z-10 overflow-hidden rounded-[1.05rem] border border-white/10 bg-black shadow-[inset_0_0_26px_rgba(0,0,0,0.92)]"
                style={{ height: ITEM_HEIGHT * VISIBLE_ROWS }}
              >
                <motion.div
                  key={`${spinKey}-${columnIndex}`}
                  initial={{ y: isSpinning ? 0 : targetY }}
                  animate={{
                    y: isSpinning
                      ? [0, targetY + 42, targetY - 18, targetY]
                      : targetY,
                    filter: isSpinning
                      ? [
                          "blur(0px)",
                          "blur(7px)",
                          isDramaReel ? "blur(3px)" : "blur(1.5px)",
                          "blur(0px)",
                        ]
                      : "blur(0px)",
                    scaleY: isSpinning ? [1, 1.035, 0.985, 1] : 1,
                  }}
                  transition={{
                    duration: isSpinning ? duration : 0.35,
                    times: [0, 0.78, 0.91, 1],
                    ease: isDramaReel
                      ? ["linear", [0.08, 0.82, 0.16, 1], "easeOut"]
                      : ["linear", [0.16, 0.8, 0.2, 1], "easeOut"],
                  }}
                >
                  {track.map((cell, symbolIndex) => {
                    const finalStartIndex = track.length - VISIBLE_ROWS;
                    const finalRowIndex = symbolIndex - finalStartIndex;
                    const isFinalPayline =
                      finalRowIndex === 1 &&
                      columnIndex >= 1 &&
                      columnIndex <= 3;

                    return (
                      <div
                        key={`${columnIndex}-${symbolIndex}-${cell.key}`}
                        className="flex items-center justify-center px-0.5"
                        style={{ height: ITEM_HEIGHT }}
                      >
                        <SymbolTile
                          cell={cell}
                          isFinalPayline={isFinalPayline}
                        />
                      </div>
                    );
                  })}
                </motion.div>

                <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-9 bg-gradient-to-b from-black/85 to-transparent" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-9 bg-gradient-to-t from-black/88 to-transparent" />

                <motion.div
                  className="pointer-events-none absolute inset-0 z-40 rounded-[1.05rem] border border-transparent"
                  animate={
                    isSpinning
                      ? {
                          borderColor: [
                            "rgba(250,204,21,0)",
                            "rgba(250,204,21,0.42)",
                            "rgba(250,204,21,0)",
                          ],
                        }
                      : {
                          borderColor: "rgba(250,204,21,0.14)",
                        }
                  }
                  transition={{
                    duration: 0.45,
                    delay: columnIndex * 0.16,
                  }}
                />
              </div>
            );
          })}
        </div>

        {isNearMiss && isSpinning && (
          <motion.div
            className="pointer-events-none absolute inset-2 z-50 rounded-[1.8rem] border border-[#FFD700]/35 bg-[#FFD700]/[0.04]"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.75, 0.22, 0.8, 0] }}
            transition={{
              delay: 0.85,
              duration: 2.45,
              ease: "easeInOut",
            }}
          />
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white/14 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/76 to-transparent" />
    </div>
  );
}