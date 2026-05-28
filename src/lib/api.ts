/**
 * SAKSHAM — API Client for frontend-backend communication.
 * Handles authentication, scan management, and dashboard data.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// ============================================================
// Auth Token Management
// ============================================================
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("saksham_token");
  if (token) return token;

  const persistedAuth = localStorage.getItem("saksham-auth");
  if (!persistedAuth) return null;

  try {
    const parsed = JSON.parse(persistedAuth);
    return parsed?.state?.token ?? null;
  } catch {
    return null;
  }
}

function setToken(token: string): void {
  localStorage.setItem("saksham_token", token);
}

function removeToken(): void {
  localStorage.removeItem("saksham_token");
}

function setUser(user: any): void {
  localStorage.setItem("saksham_user", JSON.stringify(user));
}

function getUser(): any | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("saksham_user");
  return raw ? JSON.parse(raw) : null;
}

function removeUser(): void {
  localStorage.removeItem("saksham_user");
}

// ============================================================
// Fetch Wrapper with Auth
// ============================================================
async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || error.message || `API error: ${response.status}`);
    }

    return response.json();
  } catch (error: any) {
    if (error.message === "Failed to fetch") {
      // Backend unreachable — return mock data
      console.warn(`SAKSHAM API unreachable (${endpoint}), using demo data`);
      return getMockData(endpoint) as T;
    }
    throw error;
  }
}

// ============================================================
// Auth API
// ============================================================
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  full_name: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
    role: string;
    preferences: Record<string, any>;
  };
  expires_at: string;
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
  setToken(response.access_token);
  setUser(response.user);
  return response;
}

export async function signup(data: SignupRequest): Promise<AuthResponse> {
  const response = await apiFetch<AuthResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(data),
  });
  setToken(response.access_token);
  setUser(response.user);
  return response;
}

export function logout(): void {
  removeToken();
  removeUser();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function getCurrentUser() {
  return getUser();
}

export function getOAuthStartUrl(provider: "github" | "google", nextPath = "/dashboard"): string {
  const params = new URLSearchParams({ next: nextPath });
  return `${API_BASE}/auth/oauth/${provider}/start?${params.toString()}`;
}

// ============================================================
// Scan API
// ============================================================
export interface ScanRequest {
  repository_url: string;
  scan_type?: string;
  branch?: string;
}

export async function createScan(data: ScanRequest) {
  return apiFetch("/scans/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function listScans() {
  return apiFetch("/scans/");
}

export async function getScan(scanId: string) {
  return apiFetch(`/scans/${scanId}`);
}

export async function getScanVulnerabilities(scanId: string) {
  return apiFetch(`/scans/${scanId}/vulnerabilities`);
}

export async function getScanProgress(scanId: string) {
  return apiFetch(`/scans/${scanId}/progress`);
}

// ============================================================
// Dashboard API
// ============================================================
export async function getDashboardStats() {
  return apiFetch("/dashboard/stats");
}

export async function getAgentActivity() {
  return apiFetch("/dashboard/activity");
}

export async function getVulnerabilityTrends() {
  return apiFetch("/dashboard/trends");
}

// ============================================================
// Repository API
// ============================================================
export async function listRepositories() {
  return apiFetch("/repositories/");
}

export async function addRepository(data: { url: string; name?: string }) {
  return apiFetch("/repositories/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ============================================================
// Health Check
// ============================================================
export async function checkHealth() {
  return apiFetch("/health");
}

// ============================================================
// Mock Data Fallback (when backend is unreachable)
// ============================================================
function getMockData(endpoint: string): any {
  if (endpoint === "/dashboard/stats") {
    return {
      stats: {
        total_scans: 247,
        active_scans: 3,
        total_vulnerabilities: 1342,
        critical_threats: 23,
        high_threats: 67,
        medium_threats: 189,
        low_threats: 412,
        false_positives_prevented: 891,
        security_score: 73,
      },
    };
  }
  if (endpoint === "/scans/") {
    return { scans: [] };
  }
  if (endpoint.startsWith("/scans/") && endpoint.endsWith("/vulnerabilities")) {
    return { vulnerabilities: [] };
  }
  if (endpoint === "/repositories/") {
    return { repositories: [] };
  }
  return {};
}

export { getToken, getUser, API_BASE };
