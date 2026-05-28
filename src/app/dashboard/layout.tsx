"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, LayoutDashboard, Scan, Bug, GitBranch, MessageSquare,
  Terminal, FileText, Settings, LogOut, ChevronLeft, ChevronRight,
  Network, Bell, Search, Sun, Moon, Menu, X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuthStore, useDashboardStore } from "@/stores";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/scans", label: "Scans", icon: Scan },
  { href: "/dashboard/vulnerabilities", label: "Vulnerabilities", icon: Bug },
  { href: "/dashboard/repositories", label: "Repositories", icon: GitBranch },
  { href: "/dashboard/attack-graph", label: "Attack Graph", icon: Network },
  { href: "/dashboard/chat", label: "AI Assistant", icon: MessageSquare },
  { href: "/dashboard/terminal", label: "Agent Terminal", icon: Terminal },
  { href: "/dashboard/reports", label: "Reports", icon: FileText },
];

const bottomItems = [
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { sidebarCollapsed, toggleCollapsed } = useDashboardStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, mounted, router]);

  return (
    <div className="flex h-screen overflow-hidden bg-[hsl(var(--background))]">
      {/* ============ SIDEBAR ============ */}
      {/* Desktop */}
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar))] transition-all duration-300 ease-in-out relative z-40",
          sidebarCollapsed ? "w-[68px]" : "w-[250px]"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-[hsl(var(--sidebar-border))] flex-shrink-0">
          <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          {!sidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-bold text-base tracking-tight"
            >
              SAKSHAM
            </motion.span>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-3 px-2.5 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                  isActive
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-emerald-500"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon className={cn("w-4 h-4 flex-shrink-0", isActive && "text-emerald-500")} />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-[hsl(var(--sidebar-border))] py-3 px-2.5 space-y-0.5">
          {bottomItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))] transition-all"
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          ))}
          <button
            onClick={() => { logout(); window.location.href = "/login"; }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={toggleCollapsed}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-[hsl(var(--card))] border border-[hsl(var(--border))] flex items-center justify-center hover:bg-[hsl(var(--accent))] transition-colors z-50"
        >
          {sidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed left-0 top-0 bottom-0 w-[250px] bg-[hsl(var(--sidebar))] border-r border-[hsl(var(--sidebar-border))] z-50 lg:hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-4 h-14 border-b border-[hsl(var(--sidebar-border))]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold">SAKSHAM</span>
                </div>
                <button onClick={() => setMobileOpen(false)}><X className="w-5 h-5" /></button>
              </div>
              <nav className="flex-1 py-3 px-2.5 space-y-0.5">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                      className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                        isActive ? "bg-emerald-500/10 text-emerald-500" : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]"
                      )}>
                      <item.icon className="w-4 h-4" /><span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ============ MAIN CONTENT ============ */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex items-center justify-between h-14 px-4 lg:px-6 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-1.5 rounded-lg hover:bg-[hsl(var(--accent))]">
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] w-64">
              <Search className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
              <input type="text" placeholder="Search..." className="bg-transparent text-sm flex-1 outline-none placeholder:text-[hsl(var(--muted-foreground))]" />
              <kbd className="text-[10px] text-[hsl(var(--muted-foreground))] bg-[hsl(var(--background))] px-1.5 py-0.5 rounded border border-[hsl(var(--border))]">⌘K</kbd>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {mounted && (
              <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="p-2 rounded-lg hover:bg-[hsl(var(--accent))] transition-colors">
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}
            <button className="relative p-2 rounded-lg hover:bg-[hsl(var(--accent))] transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            </button>
            <div className="flex items-center gap-2 pl-2 ml-1 border-l border-[hsl(var(--border))]">
              <div className="w-7 h-7 rounded-full gradient-bg flex items-center justify-center text-white text-xs font-bold">
                {user?.full_name?.charAt(0) || "S"}
              </div>
              <span className="hidden sm:block text-sm font-medium">{user?.full_name || "Saksham Admin"}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
