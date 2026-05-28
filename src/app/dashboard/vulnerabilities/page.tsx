"use client";

import { motion } from "framer-motion";
import { Search, AlertTriangle, FileCode } from "lucide-react";
import { useEffect, useState } from "react";
import { listVulnerabilities } from "@/lib/api";

interface VulnerabilityRecord {
  id: string;
  title: string;
  severity?: string;
  vulnerability_type?: string;
  file_path?: string;
  line_start?: number;
  is_exploitable?: boolean;
  risk_score?: number;
  repository_id?: string;
}

export default function VulnerabilitiesPage() {
  const [vulnerabilities, setVulnerabilities] = useState<VulnerabilityRecord[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadVulnerabilities() {
      setLoading(true);
      try {
        const data = await listVulnerabilities() as { vulnerabilities?: VulnerabilityRecord[] };
        setVulnerabilities(Array.isArray(data.vulnerabilities) ? data.vulnerabilities : []);
        setError("");
      } catch (err) {
        setVulnerabilities([]);
        setError(err instanceof Error ? err.message : "Unable to load vulnerabilities");
      } finally {
        setLoading(false);
      }
    }

    void loadVulnerabilities();
  }, []);

  const filtered = vulnerabilities.filter((v) => {
    const severity = (v.severity || "info").toLowerCase();
    if (filter !== "all" && severity !== filter) return false;
    if (search && !v.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Vulnerabilities</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Live findings from completed scans</p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-500">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search vulnerabilities..." className="bg-transparent text-sm flex-1 outline-none" />
        </div>
        <div className="flex gap-1.5">
          {["all", "critical", "high", "medium", "low"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${filter === f ? "gradient-bg text-white" : "bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {loading && (
          <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-sm text-[hsl(var(--muted-foreground))]">
            Loading vulnerabilities...
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-sm text-[hsl(var(--muted-foreground))]">
            No vulnerabilities found.
          </div>
        )}

        {filtered.map((v, i) => {
          const severity = (v.severity || "info").toLowerCase();
          return (
            <motion.div key={v.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover-glow"
            >
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase severity-${severity}`}>{severity}</span>
                <span className="text-sm font-medium flex-1">{v.title}</span>
                {v.is_exploitable && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-500/10 text-red-500 text-[10px] font-semibold">
                    <AlertTriangle className="w-3 h-3" /> Exploitable
                  </span>
                )}
                <div className="w-10 text-right">
                  <span className="text-xs font-bold">{Math.round(v.risk_score ?? 0)}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                <span>{v.vulnerability_type || "Unknown"}</span>
                <span className="flex items-center gap-1"><FileCode className="w-3 h-3" />{v.file_path || "Unknown file"}:{v.line_start ?? "-"}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
