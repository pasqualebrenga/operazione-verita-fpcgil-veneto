import { Suspense } from "react";
import CentralResultClient from "./CentralResultClient";

export default function CentralResultPage() {
  return (
    <Suspense fallback={<div className="ov-container" style={{ padding: 24 }}>Caricamento risultato…</div>}>
      <CentralResultClient />
    </Suspense>
  );
}
