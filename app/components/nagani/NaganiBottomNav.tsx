//app>components>nagani>NaganiBottomNav.tsx

"use client";

import { Banknote, Flame, ShieldCheck, Sparkles, Store } from "lucide-react";
import { useRouter } from "next/navigation";

type NaganiBottomNavProps = {
  active: "home" | "live" | "nagani" | "balance" | "profile";
};

export default function NaganiBottomNav({ active }: NaganiBottomNavProps) {
  const router = useRouter();

  const inactiveClass = "text-white/45";
  const activeClass = "text-nagani-gold";

  return (
    <nav className="nagani-bottom-nav fixed inset-x-0 bottom-0 z-40 px-4 pb-3 pt-2">
      <div className="mx-auto grid max-w-md grid-cols-5 items-end gap-1">
        <button
          type="button"
          onClick={() => router.push("/lobby")}
          className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2 ${
            active === "home" ? activeClass : inactiveClass
          }`}
        >
          <Store className="h-5 w-5" />
          <span className="text-[10px] font-black">Home</span>
        </button>

        <button
          type="button"
          onClick={() => router.push("/live")}
          className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2 ${
            active === "live" ? activeClass : inactiveClass
          }`}
        >
          <Sparkles className="h-5 w-5" />
          <span className="text-[10px] font-black">Live</span>
        </button>

        <button
          type="button"
          onClick={() => router.push("/?room=Dragon%27s%20Peak")}
          className="-mt-6 flex flex-col items-center"
        >
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-full border bg-gradient-to-br from-red-600 via-[#8B0000] to-black shadow-[0_0_34px_rgba(250,204,21,0.28)] ${
              active === "nagani"
                ? "border-nagani-gold/55 text-nagani-gold"
                : "border-nagani-gold/35 text-nagani-gold"
            }`}
          >
            <Flame className="h-8 w-8" />
          </div>

          <span className="mt-1 text-[10px] font-black text-nagani-gold">
            NagaNi
          </span>
        </button>

        <button
          type="button"
          onClick={() => router.push("/cashier")}
          className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2 ${
            active === "balance" ? activeClass : inactiveClass
          }`}
        >
          <Banknote className="h-5 w-5" />
          <span className="text-[10px] font-black">Balance</span>
        </button>

        <button
          type="button"
          onClick={() => router.push("/profile")}
          className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2 ${
            active === "profile" ? activeClass : inactiveClass
          }`}
        >
          <ShieldCheck className="h-5 w-5" />
          <span className="text-[10px] font-black">Profile</span>
        </button>
      </div>
    </nav>
  );
}