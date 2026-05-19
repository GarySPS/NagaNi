"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Crown,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { supabase } from "../lib/supabase";

type AuthMode = "signin" | "signup";

export default function AuthPage() {
    const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const isSignIn = mode === "signin";

async function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();

  if (submitting) return;

  try {
    setSubmitting(true);
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (isSignIn) {
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("Access approved. Entering Nagani...");
      router.push("/lobby");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(
      "Account created. Wallet provisioning trigger is ready. Entering Nagani..."
    );

    router.push("/lobby");
  } catch (error) {
    console.error("Auth action failed:", error);
    setMessage("Authentication failed. Please try again.");
  } finally {
    setSubmitting(false);
  }
}

  return (
    <main className="min-h-dvh overflow-hidden bg-[#050505] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-[-14rem] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-[#8B0000]/45 blur-[130px]" />
        <div className="absolute bottom-[-18rem] right-[-12rem] h-[34rem] w-[34rem] rounded-full bg-[#FFD700]/10 blur-[130px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:44px_44px] opacity-40" />
      </div>

      <section className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-6">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[1.5rem] border border-[#FFD700]/25 bg-[#FFD700]/10 shadow-[0_0_42px_rgba(255,215,0,0.18)] backdrop-blur-xl">
            <Crown className="h-8 w-8 text-[#FFD700]" />
          </div>

          <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-[#FFD700]/70">
            <ShieldCheck className="h-3.5 w-3.5" />
            Private Access Gateway
          </div>

          <h1 className="mt-2 bg-gradient-to-r from-white via-[#FFD700] to-[#8B0000] bg-clip-text text-5xl font-black tracking-tight text-transparent">
            NAGANI
          </h1>

          <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-white/45">
            Enter the private simulation floor. Secure profile access and wallet
            provisioning are prepared for production mode.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.18, 0.9, 0.25, 1] }}
          className="rounded-[2.25rem] border border-white/10 bg-white/[0.055] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.64)] backdrop-blur-xl"
        >
          <div className="mb-5 grid grid-cols-2 rounded-[1.5rem] border border-white/10 bg-black/35 p-1">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setMessage("");
              }}
              className={`rounded-[1.15rem] px-4 py-3 text-center font-mono text-[11px] font-black uppercase tracking-[0.18em] transition ${
                isSignIn
                  ? "bg-[#FFD700] text-black shadow-[0_0_24px_rgba(255,215,0,0.28)]"
                  : "text-white/40 hover:text-white/75"
              }`}
            >
              Sign In
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setMessage("");
              }}
              className={`rounded-[1.15rem] px-4 py-3 text-center font-mono text-[11px] font-black uppercase tracking-[0.18em] transition ${
                !isSignIn
                  ? "bg-[#FFD700] text-black shadow-[0_0_24px_rgba(255,215,0,0.28)]"
                  : "text-white/40 hover:text-white/75"
              }`}
            >
              Create Account
            </button>
          </div>

          <div className="mb-5 rounded-[1.5rem] border border-[#FFD700]/15 bg-[#FFD700]/[0.045] p-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#FFD700]/70">
              <Sparkles className="h-3.5 w-3.5" />
              {isSignIn ? "VIP Member Entry" : "New Member Registration"}
            </div>

            <p className="mt-2 text-sm leading-6 text-white/45">
              {isSignIn
                ? "Access your private Nagani simulation profile and continue from your secured wallet state."
                : "Create your production account. The database trigger will prepare a wallet automatically after registration."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-2 block font-mono text-[10px] font-black uppercase tracking-[0.22em] text-white/40">
                Email Address
              </span>

              <div className="flex items-center gap-3 rounded-[1.35rem] border border-white/10 bg-black/35 px-4 py-3 transition focus-within:border-[#FFD700]/40 focus-within:bg-black/45">
                <Mail className="h-5 w-5 text-[#FFD700]/70" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="vip@nagani.demo"
                  className="w-full bg-transparent font-mono text-sm font-bold text-white outline-none placeholder:text-white/20"
                  autoComplete="email"
                  required
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block font-mono text-[10px] font-black uppercase tracking-[0.22em] text-white/40">
                Password
              </span>

              <div className="flex items-center gap-3 rounded-[1.35rem] border border-white/10 bg-black/35 px-4 py-3 transition focus-within:border-[#FFD700]/40 focus-within:bg-black/45">
                <LockKeyhole className="h-5 w-5 text-[#FFD700]/70" />

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent font-mono text-sm font-bold text-white outline-none placeholder:text-white/20"
                  autoComplete={isSignIn ? "current-password" : "new-password"}
                  required
                  minLength={6}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="text-white/35 transition hover:text-[#FFD700]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </label>

            <motion.button
              type="submit"
              disabled={submitting}
              whileTap={{ scale: 0.94 }}
              animate={{
                boxShadow: submitting
                  ? "0 0 16px rgba(255,215,0,0.18)"
                  : [
                      "0 0 24px rgba(255,215,0,0.3)",
                      "0 0 54px rgba(255,215,0,0.52)",
                      "0 0 24px rgba(255,215,0,0.3)",
                    ],
              }}
              transition={{
                duration: 1.8,
                repeat: submitting ? 0 : Infinity,
              }}
              className="group relative mt-2 flex w-full items-center justify-center gap-3 overflow-hidden rounded-[1.6rem] border border-[#FFD700]/40 bg-gradient-to-br from-[#FFD700] via-[#f4b400] to-[#8B0000] px-6 py-4 font-black uppercase tracking-[0.22em] text-black transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/55 to-transparent transition-transform duration-700 group-hover:translate-x-[120%]" />

              <span className="relative">
                {submitting
                  ? "Processing"
                  : isSignIn
                    ? "Enter Nagani"
                    : "Create Access"}
              </span>

              <ArrowRight className="relative h-5 w-5" />
            </motion.button>
          </form>

          {message && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm leading-6 text-white/55"
            >
              {message}
            </motion.div>
          )}

          <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
            <Link
              href="/"
              className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-white/35 transition hover:text-[#FFD700]"
            >
              Back to Simulation
            </Link>

            <div className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#FFD700]/45">
              Production Auth Ready
            </div>
          </div>
        </motion.div>
      </section>
    </main>
  );
}