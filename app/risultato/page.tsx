import { Suspense } from "react";
import RisultatoClient from "./RisultatoClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="ov-container" style={{ padding: 24 }}>Caricamento…</div>}>
      <RisultatoClient />
    </Suspense>
  );
}