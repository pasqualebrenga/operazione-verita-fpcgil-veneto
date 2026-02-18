import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "@/app/components/SiteHeader";
import SiteFooter from "@/app/components/SiteFooter";

export const metadata: Metadata = {
  title: "Operazione Verità – Funzioni Locali | FPCGIL Veneto",
  description:
    "Confronto 2021→2026, arretrati 2022–2024 e perdita di potere d’acquisto in euro (Funzioni Locali).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}

