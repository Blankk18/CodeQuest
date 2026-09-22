// app/layout.tsx
// Root layout — loads Orbitron / Space Grotesk / JetBrains Mono from Google Fonts,
// injects global CSS variables (matching the original prototype exactly),
// and wraps everything in <Providers>.

import type { Metadata, Viewport } from "next";
import { Orbitron, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Providers } from "./providers";
import { HUD } from "@/components/HUD";
import "./globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-game",
  display: "swap",
});
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-ui",
  display: "swap",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-code",
  display: "swap",
});

export const metadata: Metadata = {
  title:       "CodeQuest — Learn DSA Through Adventure",
  description: "Cyberpunk code-learning RPG. Master Data Structures & Algorithms through interactive quests.",
  manifest:    "/manifest.json",
  themeColor:  "#7b6ff7",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "CodeQuest" },
  openGraph: {
    title:       "CodeQuest",
    description: "Cyberpunk DSA learning RPG",
    type:        "website",
  },
};

export const viewport: Viewport = {
  width:               "device-width",
  initialScale:        1,
  maximumScale:        1,
  themeColor:          "#7b6ff7",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <html
      lang="en"
      className={`${orbitron.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        {/* PWA icons */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body>
        <Providers session={session}>
          <HUD />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
