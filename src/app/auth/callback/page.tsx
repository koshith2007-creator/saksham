"use client";

import { Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/stores";

function normalizeNextPath(nextPath: string | null): string {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/dashboard";
  }
  return nextPath;
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const token = params.get("token");
    const email = params.get("email");
    const id = params.get("id");
    const fullName = params.get("full_name");

    if (!token || !email || !id || !fullName) {
      router.replace("/login");
      return;
    }

    login(
      {
        id,
        email,
        full_name: fullName,
        avatar_url: params.get("avatar_url") || undefined,
        role: params.get("role") || "user",
        preferences: { theme: "dark", notifications: true },
      },
      token
    );

    router.replace(normalizeNextPath(params.get("next")));
  }, [login, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] p-6">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-5 w-12 h-12 rounded-xl gradient-bg flex items-center justify-center">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-semibold mb-2">Signing you in</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Finishing authentication and opening your dashboard...
        </p>
      </div>
    </div>
  );
}
