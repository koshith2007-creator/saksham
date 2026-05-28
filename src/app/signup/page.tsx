"use client";

import { motion } from "framer-motion";
import { Shield, Eye, EyeOff, GitFork, Mail, Lock, User, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { API_BASE, getOAuthStartUrl } from "@/lib/api";
import { useAuthStore } from "@/stores";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const startOAuth = (provider: "github" | "google") => {
    window.location.href = getOAuthStartUrl(provider);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, full_name: name }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: "Signup failed" }));
        throw new Error(error.detail || "Signup failed");
      }
      const data = await res.json();
      login(data.user, data.access_token);
      router.push("/dashboard");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Signup failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] relative overflow-hidden p-6">
      <div className="fixed top-[-30%] right-[-20%] w-[700px] h-[700px] rounded-full bg-violet-500/8 dark:bg-violet-500/5 blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-30%] left-[-20%] w-[600px] h-[600px] rounded-full bg-emerald-500/8 dark:bg-emerald-500/5 blur-[150px] pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        <Link href="/" className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-lg gradient-bg flex items-center justify-center"><Shield className="w-5 h-5 text-white" /></div>
          <span className="text-xl font-bold">SAKSHAM</span>
        </Link>

        <h1 className="text-2xl font-bold mb-1">Create your account</h1>
        <p className="text-[hsl(var(--muted-foreground))] text-sm mb-8">Start securing your repositories with AI</p>

        {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-6 text-sm text-red-500">{error}</div>}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" placeholder="Your name" required />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" placeholder="you@company.com" required />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" placeholder="••••••••" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-2.5 rounded-xl gradient-bg text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6"><div className="flex-1 h-px bg-[hsl(var(--border))]" /><span className="text-xs text-[hsl(var(--muted-foreground))]">or</span><div className="flex-1 h-px bg-[hsl(var(--border))]" /></div>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => startOAuth("github")} className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[hsl(var(--border))] hover:bg-[hsl(var(--secondary))] transition-all text-sm font-medium"><GitFork className="w-4 h-4" />GitHub</button>
          <button type="button" onClick={() => startOAuth("google")} className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[hsl(var(--border))] hover:bg-[hsl(var(--secondary))] transition-all text-sm font-medium">
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Google
          </button>
        </div>
        <p className="text-center text-sm text-[hsl(var(--muted-foreground))] mt-6">Already have an account? <Link href="/login" className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline">Sign in</Link></p>
      </motion.div>
    </div>
  );
}
