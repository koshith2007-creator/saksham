"use client";

import { motion } from "framer-motion";
import { FileText, Download, Plus, Calendar, Shield, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";
import { generateReport, listReports } from "@/lib/api";

interface ReportRecord {
  id: string;
  title?: string;
  report_type?: string;
  type?: string;
  created_at?: string;
  generated_at?: string;
  scan_id?: string;
  file_url?: string;
  metadata?: Record<string, unknown>;
}

const typeColors: Record<string, string> = {
  executive: "from-violet-400 to-purple-400",
  technical: "from-blue-400 to-cyan-400",
  compliance: "from-amber-400 to-orange-400",
  custom: "from-emerald-400 to-teal-400",
};

function formatDate(value?: string): string {
  if (!value) return "Unknown date";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadReports();
  }, []);

  async function loadReports() {
    setLoading(true);
    try {
      const data = await listReports() as { reports?: ReportRecord[] };
      setReports(Array.isArray(data.reports) ? data.reports : []);
      setError("");
    } catch (err) {
      setReports([]);
      setError(err instanceof Error ? err.message : "Unable to load reports");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateReport() {
    setGenerating(true);
    setError("");
    try {
      await generateReport();
      await loadReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate report");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Security reports and export center</p>
        </div>
        <button
          onClick={handleGenerateReport}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-bg text-white text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50"
          type="button"
        >
          <Plus className="w-4 h-4" /> {generating ? "Generating" : "Generate Report"}
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-500">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Reports", value: reports.length.toString(), icon: FileText },
          { label: "Reports With Files", value: reports.filter((report) => report.file_url).length.toString(), icon: Shield },
          { label: "Report Service", value: error ? "Error" : "Connected", icon: BarChart3 },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
            <s.icon className="w-4 h-4 text-[hsl(var(--muted-foreground))] mb-2" />
            <div className="text-xl font-bold">{s.value}</div>
            <div className="text-xs text-[hsl(var(--muted-foreground))]">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {loading && (
          <div className="p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-sm text-[hsl(var(--muted-foreground))]">
            Loading reports...
          </div>
        )}

        {!loading && reports.length === 0 && (
          <div className="p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-sm text-[hsl(var(--muted-foreground))]">
            No reports have been generated yet.
          </div>
        )}

        {reports.map((report, i) => {
          const type = report.report_type || report.type || "custom";
          return (
            <motion.div key={report.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover-glow"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${typeColors[type] || typeColors.custom} flex items-center justify-center flex-shrink-0`}>
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">{report.title || "Security Report"}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                    <span className="capitalize px-1.5 py-0.5 rounded bg-[hsl(var(--secondary))]">{type}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(report.generated_at || report.created_at)}</span>
                    {report.scan_id && <span>Scan {report.scan_id}</span>}
                  </div>
                </div>
                {report.file_url && (
                  <a href={report.file_url} className="p-2 rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] transition-all">
                    <Download className="w-4 h-4" />
                  </a>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
