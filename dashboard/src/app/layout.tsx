import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ThemeSelector from "@/components/ThemeSelector";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Voting System",
  description: "Real-time voting and lucky draw dashboard",
};

const nav = [
  { href: "/", label: "Home" },
  { href: "/devices", label: "Devices" },
  { href: "/voting", label: "Voting" },
  { href: "/judge", label: "Judge" },
  { href: "/ranking", label: "Ranking" },
  { href: "/lucky-draw", label: "Lucky Draw" },
];

const themeInitScript = `
(() => {
  try {
    const savedTheme = window.localStorage.getItem("voting-system-theme");
    const theme = savedTheme === "light" || savedTheme === "dark" ? savedTheme : "dark";
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch {
    document.documentElement.dataset.theme = "dark";
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <header className="border-b border-[var(--card-border)] bg-[var(--card)]">
          <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
            <span className="text-lg font-bold text-[var(--accent)]">
              VoteSystem
            </span>
            <div className="flex flex-wrap items-center gap-4">
              {nav.map((n) => (
                <a
                  key={n.href}
                  href={n.href}
                  className="text-sm text-[var(--foreground)] transition-colors hover:text-[var(--accent)]"
                >
                  {n.label}
                </a>
              ))}
            </div>
            <ThemeSelector />
          </nav>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
