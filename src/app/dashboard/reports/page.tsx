"use client";

import { motion } from "framer-motion";
import { FileText, Download, Plus, Calendar, Shield, BarChart3, ChevronRight } from "lucide-react";

const reports = [
  { id: "r1", title: "Executive Security Report — Q1 2026", type: "executive", scan: "payment-service", date: "2026-03-15", vulns: 34, critical: 5, pages: 12 },
  { id: "r2", title: "Technical Vulnerability Report", type: "technical", scan: "auth-gateway", date: "2026-03-10", vulns: 18, critical: 2, pages: 28 },
  { id: "r3", title: "Compliance Audit — SOC 2", type: "compliance", scan: "All repositories", date: "2026-02-28", vulns: 67, critical: 8, pages: 45 },
  { id: "r4", title: "Remediation Progress Report", type: "custom", scan: "user-api", date: "2026-02-15", vulns: 12, critical: 1, pages: 8 },
];

const typeColors: Record<string, string> = {
  executive: "from-violet-400 to-purple-400",
  technical: "from-blue-400 to-cyan-400",
  compliance: "from-amber-400 to-orange-400",
  custom: "from-emerald-400 to-teal-400",
};

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Security reports and export center</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-bg text-white text-sm font-medium hover:opacity-90 transition-all">
          <Plus className="w-4 h-4" /> Generate Report
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Reports", value: "23", icon: FileText },
          { label: "Vulnerabilities Documented", value: "1,342", icon: Shield },
          { label: "Avg Report Size", value: "18 pages", icon: BarChart3 },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
            <s.icon className="w-4 h-4 text-[hsl(var(--muted-foreground))] mb-2" />
            <div className="text-xl font-bold">{s.value}</div>
            <div className="text-xs text-[hsl(var(--muted-foreground))]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Reports List */}
      <div className="space-y-3">
        {reports.map((report, i) => (
          <motion.div key={report.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover-glow"
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${typeColors[report.type]} flex items-center justify-center flex-shrink-0`}>
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm">{report.title}</h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                  <span className="capitalize px-1.5 py-0.5 rounded bg-[hsl(var(--secondary))]">{report.type}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{report.date}</span>
                  <span>{report.scan}</span>
                  <span>{report.pages} pages</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[hsl(var(--muted-foreground))] hidden sm:block">{report.vulns} vulnerabilities</span>
                <button className="p-2 rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] transition-all">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
