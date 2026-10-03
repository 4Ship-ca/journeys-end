import type { Metadata } from "next";
import "./globals.css";
import { DEFAULT_TITLE } from "../lib/detour/titles";

export const metadata: Metadata = {
  title: DEFAULT_TITLE,
  description: "Explore aviation, history and worthwhile detours. Build a personal journey with sourced discoveries and live conditions.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
