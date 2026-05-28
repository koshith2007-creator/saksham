"use client";

import { motion } from "framer-motion";
import { Bug, Search, Filter, Eye, AlertTriangle, FileCode } from "lucide-react";
import { useState } from "react";

const allVulns = [
  { id: "v1", title: "SQL Injection in User Query", severity: "critical", type: "SQL Injection", file: "src/db/queries.py", line: 45, exploitable: true, score: 97, repo: "payment-service" },
  { id: "v2", title: "Hardcoded AWS Secret Key", severity: "critical", type: "Hardcoded Secrets", file: "config/aws.py", line: 12, exploitable: true, score: 99, repo: "payment-service" },
  { id: "v3", title: "Reflected XSS in Search", severity: "high", type: "XSS", file: "src/views/search.html", line: 28, exploitable: true, score: 85, repo: "frontend-app" },
  { id: "v4", title: "SSRF via URL Parameter", severity: "critical", type: "SSRF", file: "src/api/proxy.py", line: 67, exploitable: true, score: 94, repo: "user-api" },
  { id: "v5", title: "Insecure JWT Verification", severity: "high", type: "Insecure JWT", file: "src/auth/token.py", line: 23, exploitable: true, score: 92, repo: "auth-gateway" },
  { id: "v6", title: "Path Traversal in File Upload", severity: "high", type: "Path Traversal", file: "src/upload/handler.py", line: 89, exploitable: true, score: 78, repo: "user-api" },
  { id: "v7", title: "Command Injection via Subprocess", severity: "critical", type: "Command Injection", file: "src/utils/exec.py", line: 34, exploitable: true, score: 96, repo: "data-pipeline" },
  { id: "v8", title: "Insecure Deserialization", severity: "high", type: "Deserialization", file: "src/cache/redis.py", line: 56, exploitable: false, score: 45, repo: "data-pipeline" },
  { id: "v9", title: "Missing CSRF Protection", severity: "medium", type: "CSRF", file: "src/forms/handler.py", line: 12, exploitable: false, score: 35, repo: "frontend-app" },
  { id: "v10", title: "Weak Password Hashing", severity: "medium", type: "Weak Crypto", file: "src/auth/password.py", line: 78, exploitable: false, score: 42, repo: "auth-gateway" },
];

export default function VulnerabilitiesPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = allVulns.filter((v) => {
    if (filter !== "all" && v.severity !== filter) return false;
    if (search && !v.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Vulnerabilities</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">All detected vulnerabilities across repositories</p>
      </div>

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
        {filtered.map((v, i) => (
          <motion.div key={v.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover-glow cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase severity-${v.severity}`}>{v.severity}</span>
              <span className="text-sm font-medium flex-1">{v.title}</span>
              {v.exploitable && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-500/10 text-red-500 text-[10px] font-semibold">
                  <AlertTriangle className="w-3 h-3" /> Exploitable
                </span>
              )}
              <span className="text-xs text-[hsl(var(--muted-foreground))] hidden sm:block">{v.repo}</span>
              <div className="w-10 text-right">
                <span className="text-xs font-bold">{v.score}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-[hsl(var(--muted-foreground))]">
              <span>{v.type}</span>
              <span>·</span>
              <span className="flex items-center gap-1"><FileCode className="w-3 h-3" />{v.file}:{v.line}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
