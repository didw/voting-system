import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Voting System",
  description: "Real-time voting and lucky draw dashboard",
};

const nav = [
  { href: "/", label: "Home" },
  { href: "/voting", label: "Voting" },
  { href: "/judge", label: "Judge" },
  { href: "/ranking", label: "Ranking" },
  { href: "/lucky-draw", label: "Lucky Draw" },
];

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-[var(--card-border)] bg-[var(--card)]">
          <nav className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
            <span className="text-lg font-bold text-[var(--accent)]">
              VoteSystem
            </span>
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="text-sm text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
