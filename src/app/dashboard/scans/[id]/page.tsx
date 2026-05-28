"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Bug, FileCode, Zap, Eye, AlertTriangle, Copy, Check } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { getScan, getScanVulnerabilities } from "@/lib/api";

interface ScanDetail {
  scan_id?: string;
  status?: string;
  repository_name?: string;
  repository_url?: string;
}

interface VulnerabilityRecord {
  id: string;
  title: string;
  severity: string;
  confidence?: number;
  vulnerability_type?: string;
  cwe_id?: string;
  file_path?: string;
  line_start?: number;
  risk_score?: number;
  code_snippet?: string;
  exploitability_reasoning?: string;
  patch_diff?: string;
}

export default function ScanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [scan, setScan] = useState<ScanDetail | null>(null);
  const [vulns, setVulns] = useState<VulnerabilityRecord[]>([]);
  const [selectedVuln, setSelectedVuln] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadScanDetail() {
      setLoading(true);
      try {
        const [scanData, vulnData] = await Promise.all([
          getScan(id) as Promise<ScanDetail>,
          getScanVulnerabilities(id) as Promise<{ vulnerabilities?: VulnerabilityRecord[] }>,
        ]);

        if (!active) return;

        const nextVulns = Array.isArray(vulnData.vulnerabilities) ? vulnData.vulnerabilities : [];
        setScan(scanData);
        setVulns(nextVulns);
        setSelectedVuln(nextVulns[0]?.id ?? null);
        setError("");
      } catch (error) {
        if (!active) return;
        setError(error instanceof Error ? error.message : "Unable to load scan details");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadScanDetail();

    return () => {
      active = false;
    };
  }, [id]);

  const copyPatch = (patch: string) => {
    void navigator.clipboard.writeText(patch);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeVuln = vulns.find((vuln) => vuln.id === selectedVuln);
  const severityCounts = vulns.reduce(
    (counts, vuln) => {
      const severity = vuln.severity?.toLowerCase() || "low";
      counts[severity] = (counts[severity] || 0) + 1;
      return counts;
    },
    { critical: 0, high: 0, medium: 0, low: 0 } as Record<string, number>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/scans" className="p-2 rounded-lg hover:bg-[hsl(var(--accent))] transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Scan Results</h1>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            {scan?.repository_name || scan?.repository_url || "Scan"} · ID: {id}
          </p>
        </div>
      </div>

      {loading && (
        <div className="p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-sm text-[hsl(var(--muted-foreground))]">
          Loading scan details...
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-sm text-red-500">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Critical", count: severityCounts.critical, color: "severity-critical" },
          { label: "High", count: severityCounts.high, color: "severity-high" },
          { label: "Medium", count: severityCounts.medium, color: "severity-medium" },
          { label: "Low", count: severityCounts.low, color: "severity-low" },
        ].map((severity) => (
          <div key={severity.label} className={`p-3 rounded-xl text-center ${severity.color}`}>
            <div className="text-2xl font-bold">{severity.count}</div>
            <div className="text-xs">{severity.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-sm mb-3">Vulnerabilities Found</h3>
          {vulns.map((vuln, index) => (
            <motion.button
              key={vuln.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
              onClick={() => setSelectedVuln(vuln.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selectedVuln === vuln.id
                  ? "border-emerald-500/50 bg-emerald-500/5 glow-border"
                  : "border-[hsl(var(--border))] bg-[hsl(var(--card))] hover-glow"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase severity-${vuln.severity}`}>{vuln.severity}</span>
                <span className="text-sm font-medium flex-1 truncate">{vuln.title}</span>
                <span className="text-xs text-[hsl(var(--muted-foreground))]">{vuln.risk_score ?? 0}/100</span>
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                <span className="flex items-center gap-1"><FileCode className="w-3 h-3" />{vuln.file_path}:{vuln.line_start}</span>
                <span>{vuln.cwe_id}</span>
              </div>
            </motion.button>
          ))}
        </div>

        <div className="lg:sticky lg:top-6">
          {activeVuln ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] space-y-5">
              <div>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase severity-${activeVuln.severity}`}>{activeVuln.severity}</span>
                <h3 className="text-lg font-bold mt-2">{activeVuln.title}</h3>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  {activeVuln.vulnerability_type} · {activeVuln.cwe_id} · Confidence: {((activeVuln.confidence ?? 0) * 100).toFixed(0)}%
                </p>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase text-[hsl(var(--muted-foreground))] mb-2 flex items-center gap-1"><Eye className="w-3 h-3" /> Vulnerable Code</h4>
                <pre className="p-3 rounded-lg bg-[hsl(var(--secondary))] text-xs font-mono overflow-x-auto"><code>{activeVuln.code_snippet}</code></pre>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{activeVuln.file_path}:{activeVuln.line_start}</p>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase text-[hsl(var(--muted-foreground))] mb-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> AI Exploitability Analysis</h4>
                <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10 text-sm">{activeVuln.exploitability_reasoning}</div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="h-2 flex-1 rounded-full bg-[hsl(var(--secondary))] overflow-hidden">
                    <div className="h-full rounded-full bg-red-500" style={{ width: `${activeVuln.risk_score ?? 0}%` }} />
                  </div>
                  <span className="text-xs font-bold text-red-500">{activeVuln.risk_score ?? 0}/100</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase text-[hsl(var(--muted-foreground))] mb-2 flex items-center gap-1"><Zap className="w-3 h-3" /> Remediation Patch</h4>
                <div className="relative">
                  <pre className="p-3 rounded-lg bg-[hsl(var(--secondary))] text-xs font-mono overflow-x-auto">
                    <code>{(activeVuln.patch_diff || "").split("\n").map((line, index) => (
                      <div key={index} className={line.startsWith("-") ? "text-red-400" : line.startsWith("+") ? "text-emerald-400" : ""}>{line}</div>
                    ))}</code>
                  </pre>
                  <button onClick={() => copyPatch(activeVuln.patch_diff || "")} className="absolute top-2 right-2 p-1.5 rounded-md bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] transition-all">
                    {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="p-12 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-center">
              <Bug className="w-8 h-8 mx-auto text-[hsl(var(--muted-foreground))] mb-3" />
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Select a vulnerability to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
