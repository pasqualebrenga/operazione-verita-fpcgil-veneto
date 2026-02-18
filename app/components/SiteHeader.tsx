import Link from "next/link";
import Image from "next/image";

export default function SiteHeader() {
  return (
    <header className="ov-header">
      <div className="ov-topbar">
        <div className="ov-container ov-topbar-inner">
          <div>Operazione Verità • Funzioni Locali</div>
          <div>CCNL 22–24 • 2021→2026</div>
        </div>
      </div>

      <div className="ov-container ov-header-inner">
        <Link href="/" className="ov-brand" aria-label="FPCGIL Rovigo - Operazione Verità">
          <div className="ov-logo">
            <Image
              src="/logo-fpcgil-rovigo.jpg"
              alt="FP CGIL Rovigo"
              width={170}
              height={62}
              className="ov-logo-img"
              priority
            />
          </div>

          <div>
            <div className="ov-brand-title">FPCGIL Rovigo</div>
            <div className="ov-brand-subtitle">Operazione Verità • Funzioni Locali</div>
          </div>
        </Link>

        <nav className="ov-nav">
  <a
    href="https://wa.me/393405614635?text=Operazione%20Verit%C3%A0%20FPCGIL%20Rovigo%20-%20Ciao%2C%20vorrei%20informazioni."
    className="ov-btn ov-btn-primary ov-btn-sm"
    target="_blank"
    rel="noreferrer"
  >
    Contattaci
  </a>

  <a href="/api/ics" className="ov-btn ov-btn-ghost ov-btn-sm">
    Calendario assemblee
  </a>
</nav>
      </div>
    </header>
  );
}