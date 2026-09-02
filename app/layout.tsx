import type { Metadata, Viewport } from "next";
import "./globals.css";

import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";

export const metadata: Metadata = {
  metadataBase: new URL("https://operazione-verita-fpcgil-veneto.vercel.app"),

  title: "Operazione Verità · CCNL 2025–2027 | FP CGIL Rovigo",
  description:
    "Calcola aumenti, arretrati e indennità dei CCNL Enti locali e Sanità pubblica 2025–2027.",

  applicationName: "Operazione Verita - FP Cgil Rovigo",

  openGraph: {
    title: "Operazione Verità 2025–2027 | FP CGIL Rovigo",
    description:
      "Il nuovo CCNL Funzioni Locali: aumenti, arretrati e indennità calcolati sul tuo inquadramento.",
    type: "website",
    locale: "it_IT",
    siteName: "Operazione Verita - FP Cgil Rovigo",
  },

  twitter: {
    card: "summary_large_image",
    title: "Operazione Verità 2025–2027 | FP CGIL Rovigo",
    description:
      "Calcola cosa cambia con il nuovo CCNL Funzioni Locali 2025–2027.",
  },
};

export const viewport: Viewport = {
  themeColor: "#e11d2e",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
