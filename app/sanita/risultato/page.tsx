import { Suspense } from "react";
import HealthResultClient from "./HealthResultClient";

export default function HealthResultPage() {
  return (
    <Suspense fallback={<div className="ov-container" style={{ padding: 24 }}>Caricamento risultato…</div>}>
      <HealthResultClient />
    </Suspense>
  );
}
