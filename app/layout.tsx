import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Worth the Detour — Your interests, out in the world",
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
