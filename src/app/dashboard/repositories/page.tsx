"use client";

import { motion } from "framer-motion";
import { GitBranch, Plus, Shield, Calendar, Code } from "lucide-react";
import { useEffect, useState } from "react";
import { addRepository, listRepositories } from "@/lib/api";

interface RepositoryRecord {
  id: string;
  name: string;
  url: string;
  language?: string;
  framework?: string;
  health_score?: number;
  last_scanned_at?: string;
  vulns?: number;
}

const healthColor = (health: number) => health >= 80 ? "text-emerald-500" : health >= 60 ? "text-amber-500" : "text-red-500";
const healthBg = (health: number) => health >= 80 ? "bg-emerald-500" : health >= 60 ? "bg-amber-500" : "bg-red-500";

function formatTimestamp(value?: string): string {
  if (!value) return "Not scanned yet";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function RepositoriesPage() {
  const [repositories, setRepositories] = useState<RepositoryRecord[]>([]);
  const [repoUrl, setRepoUrl] = useState("");
  const [showAddRepo, setShowAddRepo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadRepositories();
  }, []);

  async function loadRepositories() {
    setLoading(true);
    try {
      const data = await listRepositories() as { repositories?: RepositoryRecord[] };
      setRepositories(Array.isArray(data.repositories) ? data.repositories : []);
      setError("");
    } catch (error) {
      setRepositories([]);
      setError(error instanceof Error ? error.message : "Unable to load repositories");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddRepository() {
    if (!repoUrl.trim()) return;

    setSaving(true);
    setError("");
    try {
      await addRepository({ url: repoUrl.trim() });
      setRepoUrl("");
      setShowAddRepo(false);
      await loadRepositories();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to add repository");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Repositories</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Manage connected repositories</p>
        </div>
        <button onClick={() => setShowAddRepo((open) => !open)} className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-bg text-white text-sm font-medium hover:opacity-90 transition-all">
          <Plus className="w-4 h-4" /> Add Repository
        </button>
      </div>

      {showAddRepo && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="p-5 rounded-2xl bg-[hsl(var(--card))] border border-emerald-500/20 glow-border">
          <h3 className="font-semibold text-sm mb-3">Connect a Repository</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
              className="flex-1 px-4 py-2.5 rounded-xl bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            />
            <button
              onClick={handleAddRepository}
              disabled={saving || !repoUrl.trim()}
              className="px-6 py-2.5 rounded-xl gradient-bg text-white text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </motion.div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-500">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading && (
          <div className="p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-sm text-[hsl(var(--muted-foreground))]">
            Loading repositories...
          </div>
        )}

        {repositories.map((repo, index) => {
          const health = repo.health_score ?? 0;
          return (
            <motion.div
              key={repo.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover-glow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[hsl(var(--secondary))] flex items-center justify-center">
                    <GitBranch className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{repo.name}</h3>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{repo.url}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${healthColor(health)}`}>{health}</div>
                  <div className="text-[10px] text-[hsl(var(--muted-foreground))]">Health</div>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-[hsl(var(--secondary))] mb-3 overflow-hidden">
                <div className={`h-full rounded-full ${healthBg(health)} transition-all`} style={{ width: `${health}%` }} />
              </div>
              <div className="flex items-center gap-4 text-xs text-[hsl(var(--muted-foreground))]">
                <span className="flex items-center gap-1"><Code className="w-3 h-3" />{repo.language || "Unknown"}</span>
                <span>{repo.framework || "Unknown"}</span>
                {typeof repo.vulns === "number" && <span className="flex items-center gap-1"><Shield className="w-3 h-3" />{repo.vulns} vulns</span>}
                <span className="ml-auto flex items-center gap-1"><Calendar className="w-3 h-3" />{formatTimestamp(repo.last_scanned_at)}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
