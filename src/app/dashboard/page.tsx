"use client";

import { motion } from "framer-motion";
import {
  Shield, Scan, AlertTriangle, TrendingDown, Brain,
  Eye, ChevronRight, Clock, CheckCircle2, XCircle, Loader2,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie,
} from "recharts";
import { getDashboardStats } from "@/lib/api";

interface DashboardData {
  stats: {
    total_scans: number;
    active_scans: number;
    total_vulnerabilities: number;
    critical_threats: number;
    high_threats: number;
    medium_threats: number;
    low_threats: number;
    false_positives_prevented: number;
    security_score: number;
  };
  vulnerability_trends: Array<{ date: string; critical: number; high: number; medium: number; low?: number }>;
  severity_distribution: Record<string, number>;
  recent_scans: Array<{ id?: string; repository: string; status: string; vulnerabilities: number; critical: number; duration?: string }>;
  agent_activity: Array<{ id?: string; agent: string; action: string; status: string; timestamp?: string }>;
  exploitability_heatmap: Array<{ category: string; exploitable: number; not_exploitable: number }>;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const statusIcon = {
  completed: { icon: CheckCircle2, color: "text-emerald-500" },
  failed: { icon: XCircle, color: "text-red-500" },
  scanning: { icon: Loader2, color: "text-amber-500" },
  pending: { icon: Clock, color: "text-blue-500" },
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      try {
        const response = await getDashboardStats() as DashboardData;
        setData(response);
        setError("");
      } catch (err) {
        setData(null);
        setError(err instanceof Error ? err.message : "Unable to load dashboard");
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, []);

  const stats = data?.stats;
  const statCards = [
    { label: "Total Scans", value: stats?.total_scans ?? 0, icon: Scan, color: "from-emerald-400 to-cyan-400" },
    { label: "Critical Threats", value: stats?.critical_threats ?? 0, icon: AlertTriangle, color: "from-red-400 to-rose-400" },
    { label: "False Positives", value: stats?.false_positives_prevented ?? 0, icon: TrendingDown, color: "from-violet-400 to-purple-400" },
    { label: "Security Score", value: stats?.security_score ?? 0, icon: Shield, color: "from-amber-400 to-orange-400" },
  ];

  const severityData = [
    { name: "Critical", value: data?.severity_distribution?.critical ?? 0, color: "#ef4444" },
    { name: "High", value: data?.severity_distribution?.high ?? 0, color: "#f97316" },
    { name: "Medium", value: data?.severity_distribution?.medium ?? 0, color: "#eab308" },
    { name: "Low", value: data?.severity_distribution?.low ?? 0, color: "#3b82f6" },
  ];

  const exploitabilityData = (data?.exploitability_heatmap ?? []).map((row) => ({
    category: row.category,
    exploitable: row.exploitable,
    safe: row.not_exploitable,
  }));

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Security Dashboard</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Live security posture overview</p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-500">
          {error}
        </div>
      )}

      {loading && (
        <div className="p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-sm text-[hsl(var(--muted-foreground))]">
          Loading dashboard...
        </div>
      )}

      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="group p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover-glow relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full bg-gradient-to-br ${stat.color} opacity-5 -translate-y-8 translate-x-8 group-hover:opacity-10 transition-opacity`} />
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{stat.label}</div>
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
            <AreaChart data={data?.vulnerability_trends ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsla(var(--border))" />
              <XAxis dataKey="date" tick={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
              <Area type="monotone" dataKey="critical" stroke="#ef4444" fill="#ef444455" strokeWidth={2} />
              <Area type="monotone" dataKey="high" stroke="#f97316" fill="#f9731655" strokeWidth={2} />
              <Area type="monotone" dataKey="medium" stroke="#eab308" fill="#eab30844" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div variants={item} className="p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm">Exploitability Analysis</h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Real vs false positives by category</p>
            </div>
            <Eye className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={exploitabilityData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsla(var(--border))" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="category" type="category" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={80} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
              <Bar dataKey="exploitable" fill="#ef4444" radius={[0, 4, 4, 0]} name="Exploitable" />
              <Bar dataKey="safe" fill="#22c55e" radius={[0, 4, 4, 0]} opacity={0.4} name="Not Exploitable" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div variants={item} className="p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Recent Scans</h3>
            <Link href="/dashboard/scans" className="text-xs text-emerald-500 hover:underline flex items-center gap-1">
              View All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {(data?.recent_scans ?? []).map((scan) => {
              const config = statusIcon[scan.status as keyof typeof statusIcon] || statusIcon.pending;
              const Status = config.icon;
              return (
                <div key={scan.id || scan.repository} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[hsl(var(--accent))] transition-colors">
                  <Status className={`w-4 h-4 ${config.color} flex-shrink-0 ${scan.status === "scanning" ? "animate-spin" : ""}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{scan.repository}</div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))]">{scan.duration || scan.status}</div>
                  </div>
                  {scan.vulnerabilities > 0 && (
                    <div className="flex items-center gap-2 text-xs">
                      {scan.critical > 0 && <span className="px-1.5 py-0.5 rounded-md severity-critical font-medium">{scan.critical} crit</span>}
                      <span className="text-[hsl(var(--muted-foreground))]">{scan.vulnerabilities} total</span>
                    </div>
                  )}
                </div>
              );
            })}
            {!loading && (data?.recent_scans ?? []).length === 0 && (
              <div className="text-sm text-[hsl(var(--muted-foreground))]">No scans yet.</div>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div variants={item} className="p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-violet-500" />
            <h3 className="font-semibold text-sm">Agent Activity</h3>
          </div>
          <Link href="/dashboard/terminal" className="text-xs text-emerald-500 hover:underline flex items-center gap-1">
            Open Terminal <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="space-y-2">
          {(data?.agent_activity ?? []).map((event) => (
            <div key={event.id || `${event.agent}-${event.timestamp}`} className="flex items-center gap-3 p-2.5 rounded-xl bg-[hsl(var(--secondary))]">
              <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
              <span className="text-xs font-semibold text-[hsl(var(--muted-foreground))] w-28 flex-shrink-0">{event.agent}</span>
              <span className="text-xs flex-1 truncate">{event.action}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
                {event.status}
              </span>
            </div>
          ))}
          {!loading && (data?.agent_activity ?? []).length === 0 && (
            <div className="text-sm text-[hsl(var(--muted-foreground))]">No agent activity yet.</div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
