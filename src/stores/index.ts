"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ============================================================
// Auth Store
// ============================================================
interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: string;
  preferences: { theme: string; notifications: boolean };
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("saksham_token", token);
          localStorage.setItem("saksham_user", JSON.stringify(user));
        }
        set({ user, token, isAuthenticated: true });
      },
      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("saksham_token");
          localStorage.removeItem("saksham_user");
        }
        set({ user: null, token: null, isAuthenticated: false });
      },
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    { name: "saksham-auth" }
  )
);

// ============================================================
// Dashboard Store
// ============================================================
interface DashboardState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  toggleCollapsed: () => void;
  activeView: string;
  setActiveView: (view: string) => void;
}

export const useDashboardStore = create<DashboardState>()((set) => ({
  sidebarOpen: true,
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleCollapsed: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  activeView: "dashboard",
  setActiveView: (view) => set({ activeView: view }),
}));

// ============================================================
// Scan Store
// ============================================================
interface ScanState {
  activeScanId: string | null;
  scanProgress: number;
  scanStatus: string;
  setActiveScan: (id: string | null) => void;
  setScanProgress: (progress: number) => void;
  setScanStatus: (status: string) => void;
}

export const useScanStore = create<ScanState>()((set) => ({
  activeScanId: null,
  scanProgress: 0,
  scanStatus: "idle",
  setActiveScan: (id) => set({ activeScanId: id }),
  setScanProgress: (progress) => set({ scanProgress: progress }),
  setScanStatus: (status) => set({ scanStatus: status }),
}));
