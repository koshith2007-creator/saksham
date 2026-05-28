"use client";

import { motion } from "framer-motion";
import {
  Scan,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Loader2,
  XCircle,
  Clock,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createScan, listScans } from "@/lib/api";

interface ScanRecord {
  id: string;
  repository_url: string;
  repository_name?: string;
  status: string;
  scan_type: string;
  total_vulnerabilities?: number;
  critical_count?: number;
  high_count?: number;
  medium_count?: number;
  low_count?: number;
  files_scanned?: number;
  duration_seconds?: number;
  created_at?: string;
  completed_at?: string | null;
}

const statusConfig: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  completed: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  scanning: { icon: Loader2, color: "text-amber-500", bg: "bg-amber-500/10" },
  pending: { icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10" },
  failed: { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" },
};

function formatTimestamp(value?: string | null): string {
  if (!value) return "Pending";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function ScansPage() {
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [showNewScan, setShowNewScan] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  const [search, setSearch] = useState("");
  const [loadingScans, setLoadingScans] = useState(true);
  const [creatingScan, setCreatingScan] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadScans();
  }, []);

  async function loadScans() {
    setLoadingScans(true);
    try {
      const data = await listScans() as { scans?: ScanRecord[] };
      setScans(Array.isArray(data.scans) ? data.scans : []);
      setError("");
    } catch (error) {
      setScans([]);
      setError(error instanceof Error ? error.message : "Unable to load scans right now");
    } finally {
      setLoadingScans(false);
    }
  }

  async function handleCreateScan() {
    if (!repoUrl.trim()) return;

    setCreatingScan(true);
    setError("");
    try {
      await createScan({ repository_url: repoUrl.trim() });
      setRepoUrl("");
      setShowNewScan(false);
      await loadScans();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to start scan");
    } finally {
      setCreatingScan(false);
    }
  }

  const filtered = scans.filter((scan) => {
    const repoName = (scan.repository_name || scan.repository_url).toLowerCase();
    return repoName.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Security Scans</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Manage and monitor your repository scans</p>
        </div>
        <button
          onClick={() => setShowNewScan(!showNewScan)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-bg text-white text-sm font-medium hover:opacity-90 transition-all"
        >
          <Plus className="w-4 h-4" /> New Scan
        </button>
      </div>

      {showNewScan && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="p-5 rounded-2xl bg-[hsl(var(--card))] border border-emerald-500/20 glow-border"
        >
          <h3 className="font-semibold text-sm mb-3">Start New Scan</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
              className="flex-1 px-4 py-2.5 rounded-xl bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            />
            <button
              onClick={handleCreateScan}
              disabled={creatingScan || !repoUrl.trim()}
              className="px-6 py-2.5 rounded-xl gradient-bg text-white text-sm font-medium hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Scan className="w-4 h-4" /> Scan
            </button>
          </div>
        </motion.div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-500">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search scans..." className="bg-transparent text-sm flex-1 outline-none" />
        </div>
        <button className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] text-sm transition-all">
          <Filter className="w-3.5 h-3.5" /> Filter
        </button>
      </div>

      <div className="space-y-3">
        {loadingScans && (
          <div className="p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-sm text-[hsl(var(--muted-foreground))]">
            Loading scans...
          </div>
        )}

        {filtered.map((scan, i) => {
          const st = statusConfig[scan.status] || statusConfig.pending;
          const StIcon = st.icon;
          const repoName = scan.repository_name || scan.repository_url.split("/").pop() || scan.id;
          const totalVulns = scan.total_vulnerabilities ?? 0;
          const criticalCount = scan.critical_count ?? 0;
          const highCount = scan.high_count ?? 0;

          return (
            <motion.div
              key={scan.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/dashboard/scans/${scan.id}`} className="block p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover-glow">
                <div className="flex items-center gap-4">
                  <div className={`w-9 h-9 rounded-xl ${st.bg} flex items-center justify-center flex-shrink-0`}>
                    <StIcon className={`w-4 h-4 ${st.color} ${scan.status === "scanning" ? "animate-spin" : ""}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{repoName}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]">{scan.scan_type}</span>
                    </div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))]">{scan.repository_url} · {formatTimestamp(scan.completed_at || scan.created_at)}</div>
                  </div>
                  {totalVulns > 0 && (
                    <div className="hidden sm:flex items-center gap-2">
                      {criticalCount > 0 && <span className="px-2 py-0.5 rounded-lg severity-critical text-xs font-medium">{criticalCount} critical</span>}
                      {highCount > 0 && <span className="px-2 py-0.5 rounded-lg severity-high text-xs font-medium">{highCount} high</span>}
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">{totalVulns} total</span>
                    </div>
                  )}
                  <ChevronRight className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                </div>
              </Link>
            </motion.div>
          );
        })}

        {!loadingScans && filtered.length === 0 && (
          <div className="p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-sm text-[hsl(var(--muted-foreground))]">
            No scans match your search.
          </div>
        )}
      </div>
    </div>
  );
}
