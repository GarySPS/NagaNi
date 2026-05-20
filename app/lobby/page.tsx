//app>lobby>page.tsx

"use client";

import { getWallet } from "@/app/lib/actions";
import { supabase } from "@/app/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import NaganiBottomNav from "@/app/components/nagani/NaganiBottomNav";
import {
  ChevronRight,
  Flame,
  Loader2,
  PlugZap,
  RefreshCw,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type RoomName = "Green Valley" | "Golden Buffalo" | "Dragon's Peak";
type CategoryId = "nagani" | "slots" | "fishing" | "arcade";

type WalletState = {
  playable_balance: number | string | null;
  locked_vault: number | string | null;
};

type ToastState = {
  title: string;
  message: string;
} | null;

type PromoBanner = {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  cta: string;
  bannerSrc?: string;
  glyph: string;
  roomName?: RoomName;
};

type GameCard = {
  id: string;
  title: string;
  subtitle: string;
  provider: string;
  category: CategoryId;
  badge: string;
  glyph: string;
  accent: "red" | "gold" | "green" | "purple" | "blue";
  cardSrc?: string;
  roomName?: RoomName;
};

const PROMO_BANNERS: PromoBanner[] = [
  {
    id: "red-dragon",
    tag: "NAGANI ORIGINAL",
    title: "Red Dragon Myanmar",
    subtitle: "Fire reels · Bonus vault · Live winner feed",
    cta: "Play Now",
    bannerSrc: "/assets/nagani/banners/red-dragon.webp",
    glyph: "🐉",
    roomName: "Dragon's Peak",
  },
  {
    id: "daily-vault",
    tag: "DAILY VAULT",
    title: "Tomorrow Bonus",
    subtitle: "Spin today. Return tomorrow. Unlock stored value.",
    cta: "Enter Room",
    bannerSrc: "/assets/nagani/banners/daily-vault.webp",
    glyph: "🦬",
    roomName: "Golden Buffalo",
  },
  {
    id: "provider",
    tag: "PROVIDER NETWORK",
    title: "Casino Aggregator",
    subtitle: "PG Soft, Pragmatic, Jili, Fishing and Arcade demos.",
    cta: "Explore",
    bannerSrc: "/assets/nagani/banners/provider-network.webp",
    glyph: "🎰",
  },
];

const CATEGORIES: {
  id: CategoryId;
  label: string;
  icon: string;
}[] = [
  { id: "nagani", label: "NagaNi", icon: "🐉" },
  { id: "slots", label: "Slots", icon: "🎰" },
  { id: "fishing", label: "Fishing", icon: "🐟" },
  { id: "arcade", label: "Arcade", icon: "🚀" },
];

const GAME_CARDS: GameCard[] = [
  {
  id: "red-dragon-myanmar",
  title: "Red Dragon",
  subtitle: "Myanmar",
  provider: "NAGANI",
  category: "nagani",
  badge: "Original",
  glyph: "🐉",
  accent: "red",
  cardSrc: "/assets/nagani/cards/red-dragon-myanmar.webp",
  roomName: "Dragon's Peak",
},
{
  id: "dragons-peak",
  title: "Dragon's",
  subtitle: "Peak",
  provider: "NAGANI",
  category: "nagani",
  badge: "High",
  glyph: "🔥",
  accent: "red",
  cardSrc: "/assets/nagani/cards/dragons-peak.webp",
  roomName: "Dragon's Peak",
},
{
  id: "golden-buffalo",
  title: "Golden",
  subtitle: "Buffalo",
  provider: "NAGANI",
  category: "nagani",
  badge: "Medium",
  glyph: "🦬",
  accent: "gold",
  cardSrc: "/assets/nagani/cards/golden-buffalo.webp",
  roomName: "Golden Buffalo",
},
{
  id: "green-valley",
  title: "Green",
  subtitle: "Valley",
  provider: "NAGANI",
  category: "nagani",
  badge: "Low",
  glyph: "🍃",
  accent: "green",
  cardSrc: "/assets/nagani/cards/green-valley.webp",
  roomName: "Green Valley",
},

  {
    id: "pg-soft",
    title: "PG",
    subtitle: "Soft",
    provider: "PG SOFT",
    category: "slots",
    badge: "126",
    glyph: "🎰",
    accent: "gold",
  },
  {
    id: "pragmatic-play",
    title: "Pragmatic",
    subtitle: "Play",
    provider: "PRAGMATIC",
    category: "slots",
    badge: "212",
    glyph: "💎",
    accent: "purple",
  },
  {
    id: "jili-slots",
    title: "Jili",
    subtitle: "Lucky",
    provider: "JILI",
    category: "slots",
    badge: "84",
    glyph: "🍀",
    accent: "blue",
  },
  {
    id: "red-tiger",
    title: "Red",
    subtitle: "Tiger",
    provider: "RED TIGER",
    category: "slots",
    badge: "58",
    glyph: "🐅",
    accent: "red",
  },

  {
    id: "dragon-fishing",
    title: "Dragon",
    subtitle: "Fishing",
    provider: "NAGANI",
    category: "fishing",
    badge: "Hot",
    glyph: "🎣",
    accent: "blue",
  },
  {
    id: "koi-hunter",
    title: "Koi",
    subtitle: "Hunter",
    provider: "JILI",
    category: "fishing",
    badge: "New",
    glyph: "🐟",
    accent: "green",
  },
  {
    id: "ocean-gold",
    title: "Ocean",
    subtitle: "Gold",
    provider: "CQ9",
    category: "fishing",
    badge: "Gold",
    glyph: "🌊",
    accent: "gold",
  },
  {
    id: "pearl-catcher",
    title: "Pearl",
    subtitle: "Catcher",
    provider: "PG SOFT",
    category: "fishing",
    badge: "Demo",
    glyph: "🦪",
    accent: "purple",
  },

  {
    id: "plinko-dragon",
    title: "Plinko",
    subtitle: "Dragon",
    provider: "ARCADE",
    category: "arcade",
    badge: "JL",
    glyph: "🟡",
    accent: "gold",
  },
  {
    id: "tower-gold",
    title: "Tower",
    subtitle: "Gold",
    provider: "ARCADE",
    category: "arcade",
    badge: "JL",
    glyph: "🏆",
    accent: "gold",
  },
  {
    id: "lucky-wheel",
    title: "Lucky",
    subtitle: "Wheel",
    provider: "ARCADE",
    category: "arcade",
    badge: "JL",
    glyph: "🎡",
    accent: "blue",
  },
  {
    id: "keno-ruby",
    title: "Keno",
    subtitle: "Ruby",
    provider: "ARCADE",
    category: "arcade",
    badge: "JL",
    glyph: "♦️",
    accent: "purple",
  },
];

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCredits(value: number | string | null | undefined) {
  return toNumber(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getCardVisual(accent: GameCard["accent"]) {
  if (accent === "red") {
    return {
      border: "border-red-300/25",
      bg: "from-red-500/35 via-orange-500/16 to-black/65",
      glow: "shadow-[0_0_40px_rgba(239,68,68,0.18)]",
      badge: "border-red-200/25 bg-red-500/20 text-red-50",
      glyph: "text-yellow-100",
    };
  }

  if (accent === "gold") {
    return {
      border: "border-[#FFD700]/25",
      bg: "from-[#FFD700]/30 via-yellow-500/12 to-black/65",
      glow: "shadow-[0_0_34px_rgba(255,215,0,0.14)]",
      badge: "border-[#FFD700]/25 bg-[#FFD700]/15 text-[#FFD700]",
      glyph: "text-[#FFD700]",
    };
  }

  if (accent === "green") {
    return {
      border: "border-emerald-300/25",
      bg: "from-emerald-400/30 via-emerald-500/12 to-black/65",
      glow: "shadow-[0_0_34px_rgba(16,185,129,0.14)]",
      badge: "border-emerald-300/25 bg-emerald-400/15 text-emerald-100",
      glyph: "text-emerald-100",
    };
  }

  if (accent === "blue") {
    return {
      border: "border-cyan-300/25",
      bg: "from-cyan-400/30 via-blue-500/12 to-black/65",
      glow: "shadow-[0_0_34px_rgba(34,211,238,0.12)]",
      badge: "border-cyan-300/25 bg-cyan-400/15 text-cyan-100",
      glyph: "text-cyan-100",
    };
  }

  return {
    border: "border-fuchsia-300/25",
    bg: "from-fuchsia-400/30 via-purple-500/12 to-black/65",
    glow: "shadow-[0_0_34px_rgba(217,70,239,0.12)]",
    badge: "border-fuchsia-300/25 bg-fuchsia-400/15 text-fuchsia-100",
    glyph: "text-fuchsia-100",
  };
}

function GameCardAsset({
  src,
  alt,
}: {
  src?: string;
  alt: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return null;
  }

  return (
    <img
      src={src}
      alt={alt}
      className="absolute inset-0 h-full w-full object-cover opacity-95"
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}

function PromoBannerAsset({
  src,
  alt,
}: {
  src?: string;
  alt: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return null;
  }

  return (
    <img
      src={src}
      alt={alt}
      className="absolute inset-0 h-full w-full object-cover opacity-80"
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}

export default function LobbyPage() {
  const router = useRouter();
  const toastTimer = useRef<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryId>("nagani");
  const [selectedRoom, setSelectedRoom] = useState<RoomName | null>(null);
  const [activeBanner, setActiveBanner] = useState(0);
  const [toast, setToast] = useState<ToastState>(null);
  const [errorText, setErrorText] = useState("");

  const totalCredits = useMemo(() => {
    return toNumber(wallet?.playable_balance) + toNumber(wallet?.locked_vault);
  }, [wallet]);

  const visibleGames = useMemo(() => {
    return GAME_CARDS.filter((game) => game.category === activeCategory);
  }, [activeCategory]);

  useEffect(() => {
    let mounted = true;

    async function bootLobby() {
      setLoading(true);
      setErrorText("");

      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        router.replace("/auth");
        return;
      }

      try {
        const nextWallet = await getWallet(data.user.id);

        if (!mounted) return;

        setWallet({
          playable_balance: nextWallet?.playable_balance ?? 0,
          locked_vault: nextWallet?.locked_vault ?? 0,
        });

      } catch {
        if (!mounted) return;

        setErrorText("Credits syncing. Please refresh.");
        setWallet({
          playable_balance: 0,
          locked_vault: 0,
        });
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void bootLobby();

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

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveBanner((current) => (current + 1) % PROMO_BANNERS.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, []);

  async function refreshWallet() {
    setRefreshing(true);
    setErrorText("");

    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      router.replace("/auth");
      return;
    }

    try {
      const nextWallet = await getWallet(data.user.id);

      setWallet({
        playable_balance: nextWallet?.playable_balance ?? 0,
        locked_vault: nextWallet?.locked_vault ?? 0,
      });
    } catch {
      setErrorText("Wallet refresh failed.");
    } finally {
      setRefreshing(false);
    }
  }

  function showToast(nextToast: ToastState) {
    setToast(nextToast);

    if (toastTimer.current) {
      window.clearTimeout(toastTimer.current);
    }

    toastTimer.current = window.setTimeout(() => {
      setToast(null);
    }, 3000);
  }

  function enterRoom(roomName: RoomName) {
    setSelectedRoom(roomName);
    router.push(`/?room=${encodeURIComponent(roomName)}`);
  }

  function handleGameClick(game: GameCard) {
    if (game.roomName) {
      enterRoom(game.roomName);
      return;
    }

    showToast({
      title: "Provider Network",
      message: `Connecting to ${game.provider} ${game.title} ${game.subtitle}...`,
    });
  }

  function handleBannerClick(banner: PromoBanner) {
    if (banner.roomName) {
      enterRoom(banner.roomName);
      return;
    }

    showToast({
      title: "Aggregator Demo",
      message: "Opening provider network preview...",
    });
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
              Opening Casino
            </p>

            <h1 className="mt-3 text-2xl font-black tracking-tight">
              NAGANI
            </h1>
          </div>
        </div>
      </main>
    );
  }

  const banner = PROMO_BANNERS[activeBanner];

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
                <PlugZap className="h-5 w-5" />
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
  <div className="absolute left-1/2 top-[-10rem] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-nagani-dragon-red/45 blur-[120px]" />
  <div className="absolute bottom-[-14rem] right-[-10rem] h-[28rem] w-[28rem] rounded-full bg-nagani-gold/10 blur-[120px]" />
  <div className="absolute bottom-[12rem] left-[-12rem] h-[22rem] w-[22rem] rounded-full bg-nagani-jade/10 blur-[110px]" />
  <div className="nagani-grid-overlay absolute inset-0 opacity-40" />
</div>

      <section className="relative mx-auto min-h-dvh w-full max-w-md px-4 pb-28 pt-4">
<header className="sticky top-0 z-30 -mx-4 border-b border-nagani-gold/10 bg-[#120304]/90 px-4 pb-3 pt-3 shadow-[0_18px_60px_rgba(0,0,0,0.58)] backdrop-blur-2xl">
  <div className="flex items-center justify-between gap-3">
    <button
      type="button"
      onClick={() => router.push("/lobby")}
      className="flex min-w-0 items-center gap-2 text-left active:scale-[0.98]"
    >
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-nagani-gold/25 bg-nagani-gold/10 text-nagani-gold shadow-[0_0_22px_rgba(250,204,21,0.1)]">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent" />
        <Flame className="relative h-5 w-5" />
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-1.5 font-mono text-[9px] font-black uppercase tracking-[0.22em] text-nagani-gold/75">
          <span>နဂါးနီ</span>
          <span className="h-1 w-1 rounded-full bg-nagani-gold/60" />
          <span>Live</span>
        </div>

        <h1 className="mt-0.5 truncate text-[1.45rem] font-black leading-none tracking-tight text-white">
          NAGANI
        </h1>
      </div>
    </button>

    <button
      type="button"
      onClick={() => router.push("/cashier")}
      className="min-w-0 rounded-[1.2rem] border border-nagani-gold/25 bg-nagani-gold/10 px-3 py-2 text-right shadow-[0_0_24px_rgba(250,204,21,0.1)] active:scale-[0.98]"
    >
      <div className="font-mono text-[8px] font-black uppercase tracking-[0.16em] text-nagani-gold/70">
        Balance
      </div>

      <div className="max-w-[8rem] truncate font-mono text-sm font-black text-nagani-gold">
        {formatCredits(totalCredits)}
      </div>
    </button>

    <button
      type="button"
      onClick={refreshWallet}
      disabled={refreshing}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.055] text-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] active:scale-95 disabled:opacity-50"
      aria-label="Refresh balance"
    >
      <RefreshCw
        className={`h-4 w-4 ${refreshing ? "animate-spin text-nagani-gold" : ""}`}
      />
    </button>
  </div>

  {errorText && (
    <div className="mt-3 rounded-[1rem] border border-red-300/25 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-100">
      {errorText}
    </div>
  )}
</header>

<section className="mt-4">
  <motion.button
    key={banner.id}
    type="button"
    onClick={() => handleBannerClick(banner)}
    initial={{ opacity: 0, x: 18 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ type: "spring", stiffness: 180, damping: 22 }}
    className="nagani-red-panel relative min-h-[11.5rem] w-full overflow-hidden rounded-[2rem] p-4 text-left"
  >
    <PromoBannerAsset src={banner.bannerSrc} alt={banner.title} />

<div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/82 via-black/38 to-black/20" />
<div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute left-[-3rem] top-[-4rem] h-40 w-40 rounded-full bg-red-500/35 blur-3xl" />
      <div className="absolute right-[-2rem] top-[-2rem] h-44 w-44 rounded-full bg-nagani-gold/20 blur-3xl" />
      <div className="absolute bottom-[-3.5rem] right-[2rem] h-32 w-32 rounded-full bg-nagani-jade/10 blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-nagani-gold/70 to-transparent" />
    </div>

    <div className="pointer-events-none absolute -right-2 top-1/2 -translate-y-1/2">
      <div className="relative flex h-32 w-32 items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-nagani-gold/15 bg-nagani-gold/5 blur-[1px]" />
        <div className="absolute h-24 w-24 rounded-full bg-red-500/20 blur-2xl" />
<div className="relative text-7xl drop-shadow-[0_0_28px_rgba(250,204,21,0.38)]">
  {banner.glyph}
</div>
      </div>
    </div>

    <div className="relative z-10 flex min-h-[9.4rem] flex-col justify-between pr-24">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-nagani-gold/30 bg-black/35 px-3 py-1 font-mono text-[8px] font-black uppercase tracking-[0.22em] text-nagani-gold shadow-[0_0_18px_rgba(250,204,21,0.12)]">
          <Flame className="h-3 w-3" />
          {banner.tag}
        </div>

        <h2 className="mt-3 max-w-[14rem] text-[2rem] font-black leading-[0.9] tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.65)]">
          {banner.title}
        </h2>

        <p className="mt-2 max-w-[15rem] text-[12px] font-semibold leading-5 text-nagani-muted">
          {banner.subtitle}
        </p>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <div className="nagani-gold-button inline-flex items-center gap-2 rounded-full px-4 py-2 font-mono text-[9px] font-black uppercase tracking-[0.18em]">
          {banner.cta}
          <ChevronRight className="h-3.5 w-3.5" />
        </div>

        <div className="hidden rounded-full border border-white/10 bg-black/30 px-3 py-2 font-mono text-[8px] font-black uppercase tracking-[0.16em] text-white/45 min-[380px]:inline-flex">
          Live Room
        </div>
      </div>
    </div>

    <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/45 to-transparent" />
  </motion.button>

  <div className="mt-3 flex justify-center gap-1.5">
    {PROMO_BANNERS.map((item, index) => (
      <button
        key={item.id}
        type="button"
        onClick={() => setActiveBanner(index)}
        className={`h-1.5 rounded-full transition-all ${
          activeBanner === index
            ? "w-8 bg-nagani-gold shadow-[0_0_14px_rgba(250,204,21,0.55)]"
            : "w-2 bg-white/20"
        }`}
        aria-label={`Show ${item.title}`}
      />
    ))}
  </div>
</section>

<section className="mt-4">
  <div className="nagani-panel overflow-hidden rounded-[1.65rem] p-1">
    <div className="grid grid-cols-4 gap-1">
      {CATEGORIES.map((category) => {
        const active = activeCategory === category.id;

        return (
          <button
            key={category.id}
            type="button"
            onClick={() => setActiveCategory(category.id)}
            className={`relative min-h-[4.7rem] overflow-hidden rounded-[1.25rem] px-2 py-2 text-center transition active:scale-[0.97] ${
              active
                ? "text-white shadow-[0_0_28px_rgba(250,204,21,0.16)]"
                : "text-white/42"
            }`}
          >
            <div
              className={`pointer-events-none absolute inset-0 transition ${
                active
                  ? "bg-gradient-to-br from-red-500/45 via-nagani-gold/18 to-black/55"
                  : "bg-black/18"
              }`}
            />

            {active && (
              <>
                <div className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-nagani-gold/80 to-transparent" />
                <div className="pointer-events-none absolute -bottom-6 left-1/2 h-12 w-12 -translate-x-1/2 rounded-full bg-nagani-gold/20 blur-2xl" />
              </>
            )}

            <div className="relative z-10 flex h-full flex-col items-center justify-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-xl border text-xl leading-none ${
                  active
                    ? "border-nagani-gold/25 bg-black/28 shadow-[0_0_18px_rgba(250,204,21,0.12)]"
                    : "border-white/8 bg-white/[0.035]"
                }`}
              >
                {category.icon}
              </div>

              <div
                className={`mt-1.5 text-[10px] font-black leading-none ${
                  active ? "text-white" : "text-white/45"
                }`}
              >
                {category.label}
              </div>

              {active && (
                <div className="mt-1 h-1 w-5 rounded-full bg-nagani-gold shadow-[0_0_12px_rgba(250,204,21,0.65)]" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  </div>
</section>

<section className="mt-4">
  <div className="mb-3 flex items-end justify-between gap-3">
    <div>
      <div className="font-mono text-[9px] font-black uppercase tracking-[0.24em] text-nagani-gold">
        Casino Games
      </div>

      <h2 className="mt-1 text-2xl font-black tracking-tight text-white">
        {CATEGORIES.find((item) => item.id === activeCategory)?.label}
      </h2>
    </div>

    <div className="rounded-full border border-white/10 bg-black/30 px-3 py-1 font-mono text-[9px] font-black uppercase tracking-[0.16em] text-white/40">
      {visibleGames.length} Games
    </div>
  </div>

  <div className="grid grid-cols-2 gap-3">
    {visibleGames.map((game, index) => {
      const visual = getCardVisual(game.accent);
      const isOpening = selectedRoom === game.roomName;

      return (
        <motion.button
          key={game.id}
          type="button"
          onClick={() => handleGameClick(game)}
          initial={{ opacity: 0, y: 14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            delay: index * 0.035,
            type: "spring",
            stiffness: 150,
            damping: 18,
          }}
          whileTap={{ scale: 0.965 }}
          className={`group relative min-h-[13.75rem] overflow-hidden rounded-[1.7rem] border ${visual.border} bg-gradient-to-br ${visual.bg} p-3 text-left ${visual.glow}`}
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />
            <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-10 left-1/2 h-28 w-28 -translate-x-1/2 rounded-full bg-nagani-gold/10 blur-3xl" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-white/[0.03]" />
          </div>

          <div className="relative z-10 flex items-start justify-between gap-2">
            <div
              className={`rounded-full border px-2.5 py-1 font-mono text-[8px] font-black uppercase tracking-[0.14em] ${visual.badge}`}
            >
              {game.badge}
            </div>

            <div className="font-mono text-[8px] font-black uppercase tracking-[0.14em] text-white/35">
              {game.provider}
            </div>
          </div>

<div className="relative z-10 mt-4 flex justify-center">
  <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-[1.65rem] border border-white/10 bg-black/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
    <GameCardAsset
      src={game.cardSrc}
      alt={`${game.title} ${game.subtitle}`}
    />

    <div className="absolute inset-0 rounded-[1.65rem] bg-gradient-to-br from-white/10 via-transparent to-black/35" />

    <div className={`relative z-10 text-5xl drop-shadow-[0_0_18px_rgba(250,204,21,0.24)] ${visual.glyph}`}>
      {game.glyph}
    </div>
  </div>
</div>

          <div className="relative z-10 mt-4">
            <h3 className="text-[1.55rem] font-black leading-[0.92] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.65)]">
              {game.title}
            </h3>

            <p className="mt-1 text-[1.25rem] font-black leading-none text-white/82">
              {game.subtitle}
            </p>
          </div>

          <div className="relative z-10 mt-3 flex items-center justify-between">
            <div className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 font-mono text-[8px] font-black uppercase tracking-[0.14em] text-white/40">
              Tap to Play
            </div>

            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-nagani-gold/20 bg-black/40 text-nagani-gold shadow-[0_0_16px_rgba(250,204,21,0.12)] transition group-active:scale-90">
              {isOpening ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          </div>
        </motion.button>
      );
    })}
  </div>
</section>
      </section>

<NaganiBottomNav active="home" />
    </main>
  );
}