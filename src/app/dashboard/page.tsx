"use client";

import { motion } from "framer-motion";
import {
  Shield, Bug, Scan, AlertTriangle, TrendingDown, Brain,
  Activity, Zap, Eye, ChevronRight, ArrowUpRight, ArrowDownRight,
  Clock, CheckCircle2, XCircle, Loader2,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie,
} from "recharts";

// Demo data
const stats = [
  { label: "Total Scans", value: "247", change: "+12%", up: true, icon: Scan, color: "from-emerald-400 to-cyan-400" },
  { label: "Critical Threats", value: "23", change: "-18%", up: false, icon: AlertTriangle, color: "from-red-400 to-rose-400" },
  { label: "False Positives Prevented", value: "891", change: "+24%", up: true, icon: TrendingDown, color: "from-violet-400 to-purple-400" },
  { label: "Security Score", value: "73", change: "+5", up: true, icon: Shield, color: "from-amber-400 to-orange-400" },
];

const trendData = Array.from({ length: 30 }, (_, i) => ({
  date: `Day ${i + 1}`,
  critical: Math.max(0, 8 - Math.floor(i / 5) + Math.floor(Math.random() * 4) - 2),
  high: Math.max(0, 15 - Math.floor(i / 4) + Math.floor(Math.random() * 6) - 3),
  medium: Math.max(0, 25 + Math.floor(Math.random() * 10) - 5),
}));

const severityData = [
  { name: "Critical", value: 23, color: "#ef4444" },
  { name: "High", value: 67, color: "#f97316" },
  { name: "Medium", value: 189, color: "#eab308" },
  { name: "Low", value: 412, color: "#3b82f6" },
];

const recentScans = [
  { repo: "payment-service", status: "completed", vulns: 12, critical: 2, time: "5 min ago", icon: CheckCircle2, statusColor: "text-emerald-500" },
  { repo: "auth-gateway", status: "scanning", vulns: 0, critical: 0, time: "running", icon: Loader2, statusColor: "text-amber-500" },
  { repo: "user-api", status: "completed", vulns: 8, critical: 1, time: "2 hrs ago", icon: CheckCircle2, statusColor: "text-emerald-500" },
  { repo: "frontend-app", status: "completed", vulns: 23, critical: 0, time: "5 hrs ago", icon: CheckCircle2, statusColor: "text-emerald-500" },
  { repo: "data-pipeline", status: "failed", vulns: 0, critical: 0, time: "12 hrs ago", icon: XCircle, statusColor: "text-red-500" },
];

const agentActivity = [
  { agent: "Orchestrator", action: "Coordinating scan for payment-service", status: "active", color: "bg-emerald-500" },
  { agent: "Static Analysis", action: "Scanning auth-gateway: 234/567 files", status: "active", color: "bg-blue-500" },
  { agent: "Exploitability", action: "Validated SQLi in user-api", status: "done", color: "bg-violet-500" },
  { agent: "Threat Intel", action: "Correlated CVE-2026-1234 with CISA KEV", status: "done", color: "bg-amber-500" },
  { agent: "Remediation", action: "Generated patch for XSS vulnerability", status: "done", color: "bg-rose-500" },
  { agent: "Risk Scoring", action: "Computed risk for 12 vulnerabilities", status: "done", color: "bg-teal-500" },
];

const exploitabilityData = [
  { category: "Injection", exploitable: 18, safe: 45 },
  { category: "XSS", exploitable: 12, safe: 66 },
  { category: "Auth", exploitable: 8, safe: 14 },
  { category: "Crypto", exploitable: 3, safe: 32 },
  { category: "SSRF/RCE", exploitable: 6, safe: 5 },
  { category: "Secrets", exploitable: 34, safe: 11 },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Security Dashboard</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Real-time security posture overview</p>
      </div>

      {/* Stats Cards */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="group p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover-glow relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full bg-gradient-to-br ${stat.color} opacity-5 -translate-y-8 translate-x-8 group-hover:opacity-10 transition-opacity`} />
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-4 h-4 text-white" />
              </div>
              <div className={`flex items-center gap-0.5 text-xs font-medium ${stat.up ? "text-emerald-500" : "text-red-500"}`}>
                {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.change}
              </div>
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{stat.label}</div>
          </div>
        ))}
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Vulnerability Trends */}
        <motion.div variants={item} className="lg:col-span-2 p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm">Vulnerability Trends</h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Last 30 days</p>
            </div>
            <Link href="/dashboard/scans" className="text-xs text-emerald-500 hover:underline flex items-center gap-1">
              View All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="critGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="highGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="medGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#eab308" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#eab308" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsla(var(--border))" />
              <XAxis dataKey="date" tick={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
              <Area type="monotone" dataKey="critical" stroke="#ef4444" fill="url(#critGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="high" stroke="#f97316" fill="url(#highGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="medium" stroke="#eab308" fill="url(#medGrad)" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Severity Dist */}
        <motion.div variants={item} className="p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
          <h3 className="font-semibold text-sm mb-4">Severity Distribution</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={severityData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value" strokeWidth={0}>
                {severityData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {severityData.map((s) => (
              <div key={s.name} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-[hsl(var(--muted-foreground))]">{s.name}</span>
                <span className="font-semibold ml-auto">{s.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Exploitability + Recent Scans */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Exploitability Heatmap */}
        <motion.div variants={item} className="p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm">Exploitability Analysis</h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Real vs False Positives by category</p>
            </div>
            <Eye className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={exploitabilityData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsla(var(--border))" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="category" type="category" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={60} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
              <Bar dataKey="exploitable" fill="#ef4444" radius={[0, 4, 4, 0]} name="Exploitable" />
              <Bar dataKey="safe" fill="#22c55e" radius={[0, 4, 4, 0]} opacity={0.4} name="Not Exploitable" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Recent Scans */}
        <motion.div variants={item} className="p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Recent Scans</h3>
            <Link href="/dashboard/scans" className="text-xs text-emerald-500 hover:underline flex items-center gap-1">
              View All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {recentScans.map((scan, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[hsl(var(--accent))] transition-colors cursor-pointer">
                <scan.icon className={`w-4 h-4 ${scan.statusColor} flex-shrink-0 ${scan.status === "scanning" ? "animate-spin" : ""}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{scan.repo}</div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))]">{scan.time}</div>
                </div>
                {scan.vulns > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    {scan.critical > 0 && (
                      <span className="px-1.5 py-0.5 rounded-md severity-critical font-medium">{scan.critical} crit</span>
                    )}
                    <span className="text-[hsl(var(--muted-foreground))]">{scan.vulns} total</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Agent Activity Feed */}
      <motion.div variants={item} className="p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-violet-500" />
            <h3 className="font-semibold text-sm">Live Agent Activity</h3>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
            </span>
          </div>
          <Link href="/dashboard/terminal" className="text-xs text-emerald-500 hover:underline flex items-center gap-1">
            Open Terminal <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="space-y-2">
          {agentActivity.map((event, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3 p-2.5 rounded-xl bg-[hsl(var(--secondary))]"
            >
              <div className={`w-2 h-2 rounded-full ${event.color} flex-shrink-0 ${event.status === "active" ? "animate-pulse" : ""}`} />
              <span className="text-xs font-semibold text-[hsl(var(--muted-foreground))] w-28 flex-shrink-0">{event.agent}</span>
              <span className="text-xs flex-1 truncate">{event.action}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
                event.status === "active" ? "bg-emerald-500/10 text-emerald-500" : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
              }`}>
                {event.status}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
