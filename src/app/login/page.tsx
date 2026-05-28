"use client";

import { motion } from "framer-motion";
import { Shield, Eye, EyeOff, GitFork, Mail, Lock, ArrowRight, Sparkles, Sun, Moon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { API_BASE, getOAuthStartUrl } from "@/lib/api";
import { useAuthStore } from "@/stores";
import { useTheme } from "next-themes";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const { theme, setTheme } = useTheme();

  const startOAuth = (provider: "github" | "google") => {
    window.location.href = getOAuthStartUrl(provider);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const responseError = await res.json().catch(() => ({ detail: "Invalid credentials" }));
        throw new Error(responseError.detail || "Invalid credentials");
      }

      const data = await res.json();
      login(data.user, data.access_token);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[hsl(var(--background))] relative overflow-hidden">
      <div className="fixed top-[-30%] left-[-20%] w-[700px] h-[700px] rounded-full bg-emerald-500/8 dark:bg-emerald-500/5 blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-30%] right-[-20%] w-[600px] h-[600px] rounded-full bg-violet-500/8 dark:bg-violet-500/5 blur-[150px] pointer-events-none" />

      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 gradient-animated opacity-10" />
        <div className="absolute inset-0 grid-bg" />
        <div className="relative z-10 max-w-md">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center animate-pulse-glow">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl font-black tracking-tight">SAKSHAM</span>
            </div>
            <h2 className="text-4xl font-bold leading-tight mb-4">
              Your AI Security
              <br />
              <span className="gradient-text">Task Force</span> Awaits
            </h2>
            <p className="text-[hsl(var(--muted-foreground))] text-lg leading-relaxed mb-8">
              Real provider-backed analysis, exploitability validation, and remediation guidance.
            </p>
            <div className="space-y-4">
              {["Deep repository understanding", "Real-time threat correlation", "Autonomous remediation generation"].map((item, i) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.15 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <span className="text-sm text-[hsl(var(--muted-foreground))]">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
          <div className="flex justify-end mb-6">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg hover:bg-[hsl(var(--secondary))] transition-colors"
              type="button"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-lg gradient-bg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">SAKSHAM</span>
          </div>

          <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
          <p className="text-[hsl(var(--muted-foreground))] text-sm mb-8">
            Sign in to access your security dashboard
          </p>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-6 text-sm text-red-500">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                  placeholder="you@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl gradient-bg text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[hsl(var(--border))]" />
            <span className="text-xs text-[hsl(var(--muted-foreground))]">or continue with</span>
            <div className="flex-1 h-px bg-[hsl(var(--border))]" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => startOAuth("github")}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[hsl(var(--border))] hover:bg-[hsl(var(--secondary))] transition-all text-sm font-medium"
            >
              <GitFork className="w-4 h-4" />
              GitHub
            </button>
            <button
              type="button"
              onClick={() => startOAuth("google")}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[hsl(var(--border))] hover:bg-[hsl(var(--secondary))] transition-all text-sm font-medium"
            >
              Google
            </button>
          </div>

          <p className="text-center text-sm text-[hsl(var(--muted-foreground))] mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
