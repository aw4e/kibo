import type { Metadata } from "next";
import { Space_Grotesk, Cormorant_Garamond, DM_Sans } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

// Primary display — headlines, numbers, bold UI
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

// Accent italic only — "On Celo." moments, editorial phrases
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["italic"],
  variable: "--font-cormorant",
  display: "swap",
});

// Body / UI copy
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kibo — Daily Savings Streak",
  description: "Deposit 0.01 cUSD daily, build your streak, earn rewards on Celo.",
  icons: {
    icon: "/kibo.png",
    apple: "/kibo.png",
  },
  other: {
    "talentapp:project_verification": "876ddf77b1b760c74f107494b623050f0ac7e82204002c5343de1cc275f30a12b3d1741dff5652553193ac4a8753abb656a22e9271eef94623f7aa0f77bdd284",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${cormorant.variable} ${dmSans.variable}`}>
      <body className="min-h-dvh font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
