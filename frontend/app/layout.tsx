import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CyberSentinel AI — Cyber Threat Detection & SOC Platform",
  description: "Portfolio-grade AI-powered Security Operations Center with real-time log ingestion, rule-based & ML anomaly detection, event correlation, and AI-assisted threat analysis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
