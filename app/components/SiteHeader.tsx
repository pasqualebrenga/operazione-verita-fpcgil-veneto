"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const contactUrl = "https://wa.me/393405614635?text=Operazione%20Verit%C3%A0%20FPCGIL%20Rovigo%20-%20Ciao%2C%20vorrei%20informazioni.";

export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="ov-header">
      <div className="ov-container ov-header-inner">
        <Link href="/" className="ov-brand" aria-label="FPCGIL Rovigo - Operazione Verità">
          <span className="ov-logo" aria-hidden="true">
            <Image
              src="/logo-fpcgil-rovigo.jpg"
              alt=""
              width={54}
              height={67}
              className="ov-logo-img"
              priority
            />
          </span>
          <span className="ov-brand-copy">
            <span className="ov-brand-kicker">FP CGIL Rovigo</span>
            <strong className="ov-brand-title">Operazione <em>Verità</em></strong>
          </span>
          <span className="ov-contract-badge">CCNL<br /><b>25—27</b></span>
        </Link>

        <nav className="ov-nav" aria-label="Navigazione principale">
          <div className="ov-sector-nav" aria-label="Scegli il comparto">
            <Link className={pathname.startsWith("/enti-locali") ? "active" : ""} href="/enti-locali">Enti locali</Link>
            <Link className={pathname.startsWith("/sanita") ? "active" : ""} href="/sanita">Sanità</Link>
            <Link className={pathname.startsWith("/funzioni-centrali") ? "active" : ""} href="/funzioni-centrali">Funzioni centrali</Link>
          </div>
          <a className="ov-contact" href={contactUrl} target="_blank" rel="noreferrer">
            <span>Parla con noi</span><b aria-hidden="true">↗</b>
          </a>
        </nav>
      </div>
    </header>
  );
}
