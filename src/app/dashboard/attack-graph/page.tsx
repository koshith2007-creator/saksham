"use client";

import { motion } from "framer-motion";
import { Network, AlertTriangle, Shield, ArrowRight, Zap } from "lucide-react";
import { useState } from "react";

const nodes = [
  { id: "entry", label: "User Input", type: "entry", x: 50, y: 200, color: "#3b82f6" },
  { id: "ssrf", label: "SSRF", type: "vuln", x: 220, y: 120, color: "#ef4444" },
  { id: "sqli", label: "SQL Injection", type: "vuln", x: 220, y: 280, color: "#ef4444" },
  { id: "metadata", label: "Cloud Metadata", type: "target", x: 400, y: 80, color: "#f97316" },
  { id: "db", label: "Database", type: "target", x: 400, y: 240, color: "#f97316" },
  { id: "creds", label: "Credential Theft", type: "impact", x: 570, y: 160, color: "#dc2626" },
  { id: "privesc", label: "Privilege Escalation", type: "impact", x: 720, y: 160, color: "#991b1b" },
  { id: "data", label: "Data Exfiltration", type: "impact", x: 570, y: 300, color: "#dc2626" },
];

const edges = [
  { from: "entry", to: "ssrf" }, { from: "entry", to: "sqli" },
  { from: "ssrf", to: "metadata" }, { from: "sqli", to: "db" },
  { from: "metadata", to: "creds" }, { from: "db", to: "data" },
  { from: "creds", to: "privesc" }, { from: "db", to: "creds" },
];

export default function AttackGraphPage() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Attack Graph</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Visualize exploit chains and lateral movement paths</p>
      </div>

      <div className="p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <svg width="100%" height="420" viewBox="0 0 820 400" className="relative z-10">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
            </marker>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Edges */}
          {edges.map((edge, i) => {
            const from = nodes.find((n) => n.id === edge.from)!;
            const to = nodes.find((n) => n.id === edge.to)!;
            const isHovered = hoveredNode === edge.from || hoveredNode === edge.to;
            return (
              <line key={i} x1={from.x + 55} y1={from.y + 20} x2={to.x - 5} y2={to.y + 20}
                stroke={isHovered ? "#10b981" : "#4b5563"} strokeWidth={isHovered ? 2.5 : 1.5}
                strokeDasharray={isHovered ? "none" : "6 3"} markerEnd="url(#arrowhead)"
                className="transition-all duration-300"
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => (
            <g key={node.id} onMouseEnter={() => setHoveredNode(node.id)} onMouseLeave={() => setHoveredNode(null)} className="cursor-pointer">
              <rect x={node.x} y={node.y} width={110} height={40} rx={10} ry={10}
                fill={hoveredNode === node.id ? node.color : `${node.color}22`}
                stroke={node.color} strokeWidth={hoveredNode === node.id ? 2 : 1}
                filter={hoveredNode === node.id ? "url(#glow)" : "none"}
                className="transition-all duration-300"
              />
              <text x={node.x + 55} y={node.y + 24} textAnchor="middle" fontSize={11} fontWeight={600}
                fill={hoveredNode === node.id ? "white" : node.color}
                className="transition-all duration-300 pointer-events-none"
              >
                {node.label}
              </text>
            </g>
          ))}
        </svg>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-4 justify-center">
          {[
            { label: "Entry Point", color: "#3b82f6" },
            { label: "Vulnerability", color: "#ef4444" },
            { label: "Target Asset", color: "#f97316" },
            { label: "Impact", color: "#991b1b" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: l.color }} />
              {l.label}
            </div>
          ))}
        </div>
      </div>

      {/* Attack Chains */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { title: "SSRF → Metadata → Credential Theft → Privilege Escalation", risk: 97, steps: 4 },
          { title: "SQL Injection → Database → Data Exfiltration", risk: 94, steps: 3 },
          { title: "SQL Injection → Database → Credential Theft → Privilege Escalation", risk: 92, steps: 4 },
        ].map((chain, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover-glow"
          >
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-red-500" />
              <span className="text-xs font-semibold text-red-500">Risk: {chain.risk}/100</span>
              <span className="text-xs text-[hsl(var(--muted-foreground))] ml-auto">{chain.steps} steps</span>
            </div>
            <p className="text-sm font-medium">{chain.title}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
