"use client";

import { motion } from "framer-motion";
import { Settings as SettingsIcon, User, Bell, Shield, Palette, Key, Globe, Save, Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const user = useAuthStore((s) => s.user);
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [criticalAlerts, setCriticalAlerts] = useState(true);
  const [scanAlerts, setScanAlerts] = useState(true);

  useEffect(() => setMounted(true), []);

  const Section = ({ title, desc, icon: Icon, children }: { title: string; desc: string; icon: any; children: React.ReactNode }) => (
    <div className="p-6 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-[hsl(var(--secondary))] flex items-center justify-center">
          <Icon className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">{title}</h3>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">{desc}</p>
        </div>
      </div>
      {children}
    </div>
  );

  const Toggle = ({ enabled, onChange, label }: { enabled: boolean; onChange: (v: boolean) => void; label: string }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm">{label}</span>
      <button onClick={() => onChange(!enabled)} className={`w-10 h-5.5 rounded-full transition-colors relative ${enabled ? "bg-emerald-500" : "bg-[hsl(var(--secondary))]"}`}>
        <div className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-5" : "translate-x-0.5"}`} style={{ width: 18, height: 18 }} />
      </button>
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Manage your account and preferences</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        {/* Profile */}
        <Section title="Profile" desc="Your personal information" icon={User}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5 block">Full Name</label>
                <input type="text" defaultValue={user?.full_name || "Saksham Admin"} className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" />
              </div>
              <div>
                <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5 block">Email</label>
                <input type="email" defaultValue={user?.email || "admin@saksham.ai"} disabled className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] text-sm opacity-60" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5 block">Role</label>
              <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-medium">{user?.role || "admin"}</span>
            </div>
          </div>
        </Section>

        {/* Appearance */}
        <Section title="Appearance" desc="Customize the look and feel" icon={Palette}>
          {mounted && (
            <div className="flex gap-3">
              {[
                { value: "dark", icon: Moon, label: "Dark" },
                { value: "light", icon: Sun, label: "Light" },
                { value: "system", icon: Monitor, label: "System" },
              ].map((t) => (
                <button key={t.value} onClick={() => setTheme(t.value)} className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${theme === t.value ? "border-emerald-500 bg-emerald-500/5" : "border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))]"}`}>
                  <t.icon className={`w-5 h-5 ${theme === t.value ? "text-emerald-500" : "text-[hsl(var(--muted-foreground))]"}`} />
                  <span className="text-xs font-medium">{t.label}</span>
                </button>
              ))}
            </div>
          )}
        </Section>

        {/* Notifications */}
        <Section title="Notifications" desc="Alert preferences" icon={Bell}>
          <div className="space-y-1">
            <Toggle enabled={notifications} onChange={setNotifications} label="Enable notifications" />
            <Toggle enabled={criticalAlerts} onChange={setCriticalAlerts} label="Critical threat alerts" />
            <Toggle enabled={scanAlerts} onChange={setScanAlerts} label="Scan completion alerts" />
          </div>
        </Section>

        {/* API Keys */}
        <Section title="API Configuration" desc="Manage your API keys and integrations" icon={Key}>
          <div className="space-y-3">
            {["Gemini API Key", "HuggingFace Token", "GitHub Token"].map((key) => (
              <div key={key}>
                <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5 block">{key}</label>
                <input type="password" placeholder="••••••••••••••••" className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" />
              </div>
            ))}
          </div>
        </Section>

        {/* Save */}
        <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl gradient-bg text-white text-sm font-medium hover:opacity-90 transition-all">
          <Save className="w-4 h-4" /> Save Changes
        </button>
      </motion.div>
    </div>
  );
}
