import { useState, type ReactNode } from "react";
import { LogEntry, formatDate, formatTime } from "../lib/nfc";
import { IcAlert, IcClock, IcDoor, IcKey, IcTrash, IcX, SectionHead } from "./ui";

const KIND_META: Record<LogEntry["kind"], { icon: ReactNode; ring: string; label: string }> = {
  open: { icon: <IcDoor size={14} />, ring: "border-ok/50 text-ok", label: "APERTURA" },
  save: { icon: <IcKey size={14} />, ring: "border-data/50 text-data", label: "SALVATAGGIO" },
  read: { icon: <IcClock size={14} />, ring: "border-line2 text-dim", label: "LETTURA" },
  fail: { icon: <IcX size={14} />, ring: "border-err/50 text-err", label: "ERRORE" },
  delete: { icon: <IcAlert size={14} />, ring: "border-sig/50 text-sig", label: "ELIMINAZIONE" },
};

export default function AccessLog({ log, onClear }: { log: LogEntry[]; onClear: () => void }) {
  const [confirm, setConfirm] = useState(false);

  return (
    <section>
      <SectionHead
        kicker="04 · Registro"
        title="Diario degli eventi"
        right={
          log.length > 0 ? (
            confirm ? (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onClear();
                    setConfirm(false);
                  }}
                  className="press font-display border border-err bg-err/15 px-4 py-2 text-[12px] font-bold tracking-wider text-err uppercase"
                  style={{ borderRadius: "9px" }}
                >
                  Sì, svuota
                </button>
                <button
                  onClick={() => setConfirm(false)}
                  className="press font-display border border-line bg-panel px-4 py-2 text-[12px] font-bold tracking-wider text-dim uppercase"
                  style={{ borderRadius: "9px" }}
                >
                  Annulla
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setConfirm(true);
                  window.setTimeout(() => setConfirm(false), 3000);
                }}
                className="press font-display flex items-center gap-2 border border-line bg-panel px-4 py-2 text-[12px] font-bold tracking-wider text-dim uppercase hover:border-err/50 hover:text-err"
                style={{ borderRadius: "9px" }}
              >
                <IcTrash size={13} /> Svuota registro
              </button>
            )
          ) : undefined
        }
      />

      {log.length === 0 ? (
        <div className="border border-dashed border-line2 bg-hull/50 px-6 py-14 text-center" style={{ borderRadius: "20px" }}>
          <IcClock size={34} className="mx-auto text-faint" />
          <p className="font-display mt-4 text-lg font-bold text-ink">Nessun evento registrato</p>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-dim">
            Letture, salvataggi e aperture di porta compariranno qui, in ordine cronologico.
          </p>
        </div>
      ) : (
        <ol className="overflow-hidden border border-line bg-hull" style={{ borderRadius: "18px" }}>
          {log.map((e, i) => {
            const m = KIND_META[e.kind];
            return (
              <li
                key={e.id}
                className={`flex items-center gap-3.5 px-4 py-3 transition-colors hover:bg-panel/60 ${
                  i !== log.length - 1 ? "border-b border-line" : ""
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center border ${m.ring}`}
                  style={{ borderRadius: "9px" }}
                >
                  {m.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium text-ink">{e.message}</p>
                  <p className="font-tech text-[10px] tracking-[0.16em] text-faint">
                    {formatDate(e.at).toUpperCase()} · {formatTime(e.at)}
                  </p>
                </div>
                <span
                  className={`font-tech hidden border px-2 py-0.5 text-[9px] tracking-[0.18em] sm:inline ${m.ring}`}
                  style={{ borderRadius: "6px" }}
                >
                  {m.label}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
