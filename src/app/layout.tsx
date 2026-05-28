import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";

export const metadata: Metadata = {
  title: "SAKSHAM — AI-Native Cybersecurity Platform",
  description:
    "Autonomous AI security engineering platform. Multi-agent architecture for deep repository analysis, exploitability validation, threat intelligence, and intelligent remediation.",
  keywords: ["cybersecurity", "AI", "vulnerability scanner", "security platform", "DevSecOps"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
