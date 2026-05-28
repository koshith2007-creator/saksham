"use client";

import { motion } from "framer-motion";
import {
  Shield,
  Zap,
  Brain,
  Lock,
  Eye,
  Terminal,
  ChevronRight,
  Sparkles,
  Network,
  ArrowRight,
  Sun,
  Moon,
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const features = [
  { icon: Brain, title: "Multi-Agent AI", desc: "12 specialized agents collaborate as an elite cybersecurity task force", color: "from-emerald-400 to-cyan-400" },
  { icon: Eye, title: "Exploitability Validation", desc: "AI validates REAL exploitability — eliminating false positives", color: "from-violet-400 to-purple-400" },
  { icon: Network, title: "Attack Graph Mapping", desc: "Visualize exploit chains, lateral movement, and privilege escalation", color: "from-amber-400 to-orange-400" },
  { icon: Zap, title: "Autonomous Remediation", desc: "Production-safe patches generated with full context awareness", color: "from-rose-400 to-pink-400" },
  { icon: Lock, title: "Threat Intelligence", desc: "Live correlation with CISA KEV, MITRE ATT&CK, EPSS, and CVE databases", color: "from-blue-400 to-indigo-400" },
  { icon: Terminal, title: "AI Dev Copilot", desc: "Ask questions about any repository — architecture, setup, security", color: "from-teal-400 to-emerald-400" },
];

const stats = [
  { value: "98%", label: "False Positive Reduction" },
  { value: "12", label: "Autonomous AI Agents" },
  { value: "<45s", label: "Average Scan Time" },
  { value: "50+", label: "Vulnerability Types" },
];

function MatrixRain() {
  const [columns, setColumns] = useState<number[]>([]);
  useEffect(() => {
    setColumns(Array.from({ length: 30 }, (_, i) => i));
  }, []);
  return (
    <div className="absolute inset-0 overflow-hidden opacity-[0.04] dark:opacity-[0.07] pointer-events-none">
      {columns.map((i) => (
        <div
          key={i}
          className="absolute text-xs font-mono text-emerald-500 whitespace-nowrap"
          style={{
            left: `${(i / 30) * 100}%`,
            animationDuration: `${8 + Math.random() * 12}s`,
            animationDelay: `${Math.random() * 5}s`,
            animation: `matrix-rain ${8 + Math.random() * 12}s linear infinite`,
          }}
        >
          {Array.from({ length: 40 }, () =>
            String.fromCharCode(0x30a0 + Math.random() * 96)
          ).join("\n")}
        </div>
      ))}
    </div>
  );
}

export default function LandingPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] relative overflow-hidden">
      <MatrixRain />

      {/* Ambient glow orbs */}
      <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-violet-500/10 dark:bg-violet-500/5 blur-[120px] pointer-events-none" />

      {/* ============ NAVBAR ============ */}
      <nav className="relative z-50 flex items-center justify-between px-6 lg:px-12 py-4 glass-strong">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg gradient-bg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">SAKSHAM</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">Features</a>
          <a href="#agents" className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">Agents</a>
          <a href="#stats" className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">Stats</a>
        </div>

        <div className="flex items-center gap-3">
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg hover:bg-[hsl(var(--secondary))] transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--secondary))] transition-all"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 text-sm font-medium rounded-lg gradient-bg text-white hover:opacity-90 transition-all"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* ============ HERO ============ */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Native Autonomous Security Platform
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9] mb-6">
            <span className="gradient-text">Security</span>
            <br />
            <span className="text-[hsl(var(--foreground))]">Reimagined</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-xl text-[hsl(var(--muted-foreground))] leading-relaxed mb-10">
            12 autonomous AI agents working as your elite cybersecurity task force.
            Deep repository understanding. Real exploitability validation. Zero noise.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="group px-8 py-3.5 rounded-xl gradient-bg text-white font-semibold text-base flex items-center gap-2 hover:opacity-90 transition-all hover:shadow-lg hover:shadow-emerald-500/25"
            >
              Start Scanning
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="px-8 py-3.5 rounded-xl font-semibold text-base border border-[hsl(var(--border))] hover:bg-[hsl(var(--secondary))] transition-all flex items-center gap-2"
            >
              <Terminal className="w-4 h-4" />
              View Demo
            </Link>
          </div>
        </motion.div>

        {/* Hero terminal preview */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-16 max-w-3xl mx-auto"
        >
          <div className="terminal rounded-xl overflow-hidden shadow-2xl shadow-black/20">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="ml-3 text-xs text-white/30 font-mono">saksham — agent terminal</span>
            </div>
            <div className="p-5 space-y-2 text-left text-sm">
              <div className="flex gap-2">
                <span className="terminal-prompt">▶</span>
                <span className="text-white/90">saksham scan https://github.com/acme/payment-api</span>
              </div>
              <div className="terminal-output">⠋ Cloning repository...</div>
              <div className="terminal-success">✓ Repository cloned (234 files, 12.4k LOC)</div>
              <div className="terminal-output">⠋ Orchestrator delegating to 6 agents...</div>
              <div className="terminal-success">✓ Static Analysis: 47 potential findings</div>
              <div className="terminal-success">✓ Dependency Agent: 3 vulnerable packages</div>
              <div className="terminal-warning">⚠ Exploitability Agent: 12/47 validated as exploitable</div>
              <div className="terminal-error">✗ CRITICAL: SQL Injection in src/db/queries.py:45</div>
              <div className="terminal-error">✗ CRITICAL: Hardcoded AWS key in config/aws.py:12</div>
              <div className="terminal-success">✓ Remediation Agent: 12 patches generated</div>
              <div className="terminal-success">✓ Threat Intel: 2 actively exploited CVEs found</div>
              <div className="mt-3 pt-3 border-t border-white/5">
                <span className="terminal-prompt">▶</span>
                <span className="text-white/90"> Scan complete — </span>
                <span className="text-red-400 font-semibold">4 critical</span>
                <span className="text-white/50"> · </span>
                <span className="text-orange-400">3 high</span>
                <span className="text-white/50"> · </span>
                <span className="text-yellow-400">3 medium</span>
                <span className="text-white/50"> · </span>
                <span className="text-blue-400">2 low</span>
                <span className="text-white/50"> · 35 false positives prevented</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ============ STATS ============ */}
      <section id="stats" className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center p-6 rounded-2xl glass hover-glow"
            >
              <div className="text-3xl md:text-4xl font-black gradient-text mb-1">{stat.value}</div>
              <div className="text-sm text-[hsl(var(--muted-foreground))]">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section id="features" className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Intelligent by <span className="gradient-text">Design</span>
          </h2>
          <p className="text-lg text-[hsl(var(--muted-foreground))] max-w-xl mx-auto">
            Every feature is powered by purpose-built AI agents that reason, validate, and act.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group p-6 rounded-2xl glass hover-glow cursor-default"
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============ AGENTS SHOWCASE ============ */}
      <section id="agents" className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Meet Your <span className="gradient-text">AI Task Force</span>
          </h2>
          <p className="text-lg text-[hsl(var(--muted-foreground))] max-w-xl mx-auto">
            12 specialized agents working together as your autonomous security team.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            { name: "Orchestrator", icon: "🎯", desc: "Coordinates all agents" },
            { name: "Static Analysis", icon: "🔍", desc: "Deep code scanning" },
            { name: "Dependency", icon: "📦", desc: "Supply chain security" },
            { name: "Exploitability", icon: "💀", desc: "Validates real threats" },
            { name: "Threat Intel", icon: "🌐", desc: "Live threat feeds" },
            { name: "Risk Scoring", icon: "📊", desc: "Contextual prioritization" },
            { name: "Remediation", icon: "🛡️", desc: "Auto-generates patches" },
            { name: "Repo Intel", icon: "🧠", desc: "Understands codebases" },
            { name: "Attack Graph", icon: "🕸️", desc: "Maps exploit chains" },
            { name: "Memory", icon: "💾", desc: "Persistent context" },
            { name: "PDF Report", icon: "📄", desc: "Executive reports" },
            { name: "Dev Copilot", icon: "🤖", desc: "Developer guidance" },
          ].map((agent, i) => (
            <motion.div
              key={agent.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-xl glass hover-glow text-center"
            >
              <div className="text-2xl mb-2">{agent.icon}</div>
              <div className="text-sm font-semibold mb-1">{agent.name}</div>
              <div className="text-xs text-[hsl(var(--muted-foreground))]">{agent.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="p-12 rounded-3xl glass glow-border"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to <span className="gradient-text">Secure</span> Your Code?
          </h2>
          <p className="text-[hsl(var(--muted-foreground))] mb-8 max-w-lg mx-auto">
            Join the next generation of AI-native security. Start scanning in seconds.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl gradient-bg text-white font-semibold hover:opacity-90 transition-all hover:shadow-lg hover:shadow-emerald-500/25"
          >
            Get Started Free
            <ChevronRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="relative z-10 border-t border-[hsl(var(--border))] py-8 px-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-emerald-500" />
          <span className="font-semibold text-[hsl(var(--foreground))]">SAKSHAM</span>
        </div>
        <p>AI-Native Autonomous Cybersecurity Platform · Built for the Future</p>
      </footer>
    </div>
  );
}
