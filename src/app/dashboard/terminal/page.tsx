"use client";

import { motion } from "framer-motion";
import { Terminal as TermIcon, Play, Pause, RotateCcw, Maximize2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface LogEntry {
  id: number;
  timestamp: string;
  agent: string;
  action: string;
  type: "info" | "success" | "warning" | "error" | "system";
}

const agentColors: Record<string, string> = {
  Orchestrator: "text-emerald-400",
  "Static Analysis": "text-blue-400",
  Dependency: "text-cyan-400",
  Exploitability: "text-red-400",
  "Threat Intel": "text-amber-400",
  "Risk Scoring": "text-purple-400",
  Remediation: "text-teal-400",
  "Repo Intel": "text-indigo-400",
  "Attack Graph": "text-rose-400",
  Memory: "text-violet-400",
  System: "text-gray-400",
};

const typeSymbol: Record<string, string> = {
  info: "ℹ",
  success: "✓",
  warning: "⚠",
  error: "✗",
  system: "▶",
};

const typeColor: Record<string, string> = {
  info: "text-blue-400",
  success: "text-emerald-400",
  warning: "text-amber-400",
  error: "text-red-400",
  system: "text-gray-400",
};

const demoLogs: Omit<LogEntry, "id" | "timestamp">[] = [
  { agent: "System", action: "SAKSHAM Agent Terminal v1.0.0 initialized", type: "system" },
  { agent: "System", action: "Connected to agent orchestration network", type: "system" },
  { agent: "System", action: "12 agents online. Status: OPERATIONAL", type: "success" },
  { agent: "System", action: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", type: "system" },
  { agent: "Orchestrator", action: "Received scan request: acme-corp/payment-service", type: "info" },
  { agent: "Orchestrator", action: "Initializing scan pipeline — Full Scan Mode", type: "info" },
  { agent: "Orchestrator", action: "Delegating to 6 agents in parallel...", type: "info" },
  { agent: "System", action: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", type: "system" },
  { agent: "Static Analysis", action: "Cloning repository...", type: "info" },
  { agent: "Static Analysis", action: "Repository cloned: 234 files, 12,487 LOC", type: "success" },
  { agent: "Static Analysis", action: "Detecting language: Python (FastAPI)", type: "info" },
  { agent: "Static Analysis", action: "Loading Semgrep rules for Python...", type: "info" },
  { agent: "Static Analysis", action: "Scanning file  1/234: src/main.py", type: "info" },
  { agent: "Static Analysis", action: "Scanning file 50/234: src/api/routes.py", type: "info" },
  { agent: "Static Analysis", action: "Scanning file 120/234: src/db/queries.py", type: "info" },
  { agent: "Static Analysis", action: "⚡ FINDING: SQL Injection at src/db/queries.py:45", type: "warning" },
  { agent: "Static Analysis", action: "Scanning file 180/234: config/aws.py", type: "info" },
  { agent: "Static Analysis", action: "⚡ FINDING: Hardcoded secret at config/aws.py:12", type: "warning" },
  { agent: "Static Analysis", action: "Scan complete: 47 potential findings in 234 files", type: "success" },
  { agent: "System", action: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", type: "system" },
  { agent: "Dependency", action: "Analyzing requirements.txt, package.json...", type: "info" },
  { agent: "Dependency", action: "Found 45 direct dependencies, 128 transitive", type: "info" },
  { agent: "Dependency", action: "Querying NVD, OSV.dev, GHSA databases...", type: "info" },
  { agent: "Dependency", action: "⚡ CVE-2026-1234: requests 2.28.0 (HIGH)", type: "warning" },
  { agent: "Dependency", action: "⚡ CVE-2026-5678: pyjwt 2.6.0 (CRITICAL)", type: "error" },
  { agent: "Dependency", action: "Analysis complete: 3 vulnerable packages", type: "success" },
  { agent: "System", action: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", type: "system" },
  { agent: "Exploitability", action: "Validating 47 findings for real exploitability...", type: "info" },
  { agent: "Exploitability", action: "Analyzing taint flow for SQL Injection...", type: "info" },
  { agent: "Exploitability", action: "Input source: HTTP request → user_id parameter", type: "info" },
  { agent: "Exploitability", action: "Sink: f-string SQL query (no parameterization)", type: "info" },
  { agent: "Exploitability", action: "Sanitization: NONE detected", type: "warning" },
  { agent: "Exploitability", action: "✓ VALIDATED: SQL Injection is EXPLOITABLE (confidence: 97%)", type: "error" },
  { agent: "Exploitability", action: "Validating hardcoded AWS key...", type: "info" },
  { agent: "Exploitability", action: "✓ VALIDATED: AWS key is active and exploitable (99%)", type: "error" },
  { agent: "Exploitability", action: "Result: 12/47 findings validated as exploitable", type: "success" },
  { agent: "Exploitability", action: "35 false positives prevented ✨", type: "success" },
  { agent: "System", action: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", type: "system" },
  { agent: "Threat Intel", action: "Enriching findings with threat intelligence...", type: "info" },
  { agent: "Threat Intel", action: "Querying CISA KEV, MITRE ATT&CK, EPSS...", type: "info" },
  { agent: "Threat Intel", action: "CVE-2026-1234: EPSS 0.87, listed in CISA KEV", type: "error" },
  { agent: "Threat Intel", action: "CVE-2026-5678: Ransomware associated ☠️", type: "error" },
  { agent: "Threat Intel", action: "Threat enrichment complete", type: "success" },
  { agent: "Risk Scoring", action: "Computing contextual risk scores...", type: "info" },
  { agent: "Risk Scoring", action: "SQL Injection: Risk 97/100 (Critical)", type: "error" },
  { agent: "Risk Scoring", action: "Hardcoded Secret: Risk 99/100 (Critical)", type: "error" },
  { agent: "Risk Scoring", action: "SSRF: Risk 94/100 (Critical)", type: "error" },
  { agent: "Risk Scoring", action: "Risk scoring complete for 12 vulnerabilities", type: "success" },
  { agent: "System", action: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", type: "system" },
  { agent: "Remediation", action: "Generating secure patches with Gemini...", type: "info" },
  { agent: "Remediation", action: "Patch 1/12: SQL Injection → Parameterized query", type: "success" },
  { agent: "Remediation", action: "Patch 2/12: AWS key → Environment variable", type: "success" },
  { agent: "Remediation", action: "Patch 3/12: SSRF → URL allowlisting", type: "success" },
  { agent: "Remediation", action: "12 remediation patches generated", type: "success" },
  { agent: "Attack Graph", action: "Building attack chain visualization...", type: "info" },
  { agent: "Attack Graph", action: "Identified 3 critical attack paths", type: "warning" },
  { agent: "Attack Graph", action: "Longest chain: Entry → SSRF → Metadata → Privesc (4 hops)", type: "warning" },
  { agent: "Memory", action: "Storing scan results in persistent memory", type: "info" },
  { agent: "Memory", action: "Repository context updated", type: "success" },
  { agent: "System", action: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", type: "system" },
  { agent: "Orchestrator", action: "SCAN COMPLETE in 34.2 seconds", type: "success" },
  { agent: "Orchestrator", action: "Summary: 4 critical · 3 high · 3 medium · 2 low", type: "success" },
  { agent: "Orchestrator", action: "35 false positives prevented. 12 patches ready.", type: "success" },
  { agent: "System", action: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", type: "system" },
];

export default function TerminalPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [logIndex, setLogIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    if (!running || logIndex >= demoLogs.length) {
      if (logIndex >= demoLogs.length) setRunning(false);
      return;
    }
    const delay = demoLogs[logIndex].type === "system" ? 200 : 80 + Math.random() * 180;
    const timer = setTimeout(() => {
      const now = new Date();
      const ts = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}.${now.getMilliseconds().toString().padStart(3, "0")}`;
      setLogs((prev) => [...prev, { ...demoLogs[logIndex], id: logIndex, timestamp: ts }]);
      setLogIndex((i) => i + 1);
    }, delay);
    return () => clearTimeout(timer);
  }, [running, logIndex]);

  const startDemo = () => { setLogs([]); setLogIndex(0); setRunning(true); };
  const togglePause = () => setRunning((r) => !r);

  return (
    <div className="space-y-4 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TermIcon className="w-5 h-5 text-emerald-500" /> Agent Terminal
          </h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Real-time AI agent activity stream</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={startDemo} className="flex items-center gap-2 px-3 py-1.5 rounded-lg gradient-bg text-white text-xs font-medium hover:opacity-90 transition-all">
            <Play className="w-3 h-3" /> Run Demo
          </button>
          {logs.length > 0 && (
            <button onClick={togglePause} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[hsl(var(--border))] text-xs font-medium hover:bg-[hsl(var(--accent))] transition-all">
              {running ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {running ? "Pause" : "Resume"}
            </button>
          )}
          <button onClick={() => { setLogs([]); setLogIndex(0); setRunning(false); }} className="p-1.5 rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] transition-all">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal */}
      <div className="terminal flex-1 flex flex-col overflow-hidden">
        {/* Terminal header */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 flex-shrink-0">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
          <span className="ml-3 text-[10px] text-white/30 font-mono">saksham-agent-terminal — live</span>
          {running && (
            <span className="ml-auto flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> STREAMING
            </span>
          )}
        </div>

        {/* Logs */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-0.5">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <TermIcon className="w-12 h-12 text-white/10 mb-4" />
              <p className="text-sm text-white/30 mb-1">Agent Terminal Ready</p>
              <p className="text-xs text-white/20">Click &quot;Run Demo&quot; to see the agents in action</p>
            </div>
          ) : (
            logs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-start gap-2 py-0.5 font-mono text-[13px] leading-relaxed"
              >
                <span className="text-white/20 flex-shrink-0 w-[85px]">{log.timestamp}</span>
                <span className={`${typeColor[log.type]} flex-shrink-0 w-3`}>{typeSymbol[log.type]}</span>
                <span className={`${agentColors[log.agent] || "text-gray-400"} flex-shrink-0 font-semibold`} style={{ width: "120px" }}>
                  [{log.agent}]
                </span>
                <span className={`${
                  log.type === "error" ? "text-red-300" :
                  log.type === "warning" ? "text-amber-200" :
                  log.type === "success" ? "text-emerald-300" :
                  log.type === "system" ? "text-white/30" :
                  "text-white/70"
                }`}>
                  {log.action}
                </span>
              </motion.div>
            ))
          )}
          {running && logIndex < demoLogs.length && (
            <div className="flex items-center gap-2 py-1">
              <span className="text-white/20 w-[85px]" />
              <span className="text-emerald-400 animate-pulse">▊</span>
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between px-4 py-1.5 border-t border-white/5 text-[10px] font-mono text-white/30">
          <span>Logs: {logs.length}/{demoLogs.length}</span>
          <span>Agents: 12 ONLINE</span>
          <span>{running ? "STREAMING" : logIndex >= demoLogs.length ? "COMPLETE" : "IDLE"}</span>
        </div>
      </div>
    </div>
  );
}
