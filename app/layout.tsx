import type { Metadata, Viewport } from "next";
import "./globals.css";

import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";

export const metadata: Metadata = {
  metadataBase: new URL("https://operazione-verita-fpcgil-veneto.vercel.app"),

  title: "Operazione Verita - Funzioni Locali | FP Cgil Rovigo",
  description:
    "Calcola pre/post rinnovo 2021-2026, potere d'acquisto in euro e arretrati 2022-2024. Dati tabellari: materiale CGIL fornito.",

  applicationName: "Operazione Verita - FP Cgil Rovigo",

  openGraph: {
    title: "Operazione Verita - Funzioni Locali | FP Cgil Rovigo",
    description:
      "Calcola pre/post rinnovo 2021-2026, potere d'acquisto in euro e arretrati 2022-2024.",
    type: "website",
    locale: "it_IT",
    siteName: "Operazione Verita - FP Cgil Rovigo",
  },

  twitter: {
    card: "summary_large_image",
    title: "Operazione Verita - Funzioni Locali | FP Cgil Rovigo",
    description:
      "Pre/post 2021-2026, potere d'acquisto in euro, arretrati 2022-2024.",
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