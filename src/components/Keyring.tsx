import { useState } from "react";
import { NfcCard, formatDate, formatTime } from "../lib/nfc";
import { CoilTag, IcPlay, IcScan, IcTrash, SectionHead } from "./ui";

const TONE_BY_KIND: Record<NfcCard["kind"], "sig" | "data" | "ok" | "dim"> = {
  mifare1k: "sig",
  mifare4k: "sig",
  ntag: "data",
  isodep: "ok",
  ndef: "data",
};

export default function Keyring({
  cards,
  activeId,
  onSelect,
  onEmulate,
  onDelete,
  onGoScan,
}: {
  cards: NfcCard[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onEmulate: (id: string) => void;
  onDelete: (id: string) => void;
  onGoScan: () => void;
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  return (
    <section>
      <SectionHead
        kicker="02 · Portachiavi"
        title="Schede memorizzate"
        right={
          <p className="font-tech text-[11px] tracking-[0.18em] text-faint uppercase">
            {cards.length} {cards.length === 1 ? "scheda" : "schede"} · salvate in locale
          </p>
        }
      />

      {cards.length === 0 ? (
        <div className="flex flex-col items-center border border-dashed border-line2 bg-hull/50 px-6 py-16 text-center" style={{ borderRadius: "20px" }}>
          <div className="w-44 opacity-70">
            <CoilTag tone="dim" className="w-full" />
          </div>
          <p className="font-display mt-6 text-lg font-bold text-ink">Portachiavi vuoto</p>
          <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-dim">
            Nessuna scheda salvata. Avvia una lettura per memorizzare la prima tessera:
            resterà qui anche dopo il riavvio.
          </p>
          <button
            onClick={onGoScan}
            className="press font-display mt-6 flex items-center gap-2 border border-sig bg-sig/10 px-5 py-2.5 text-sm font-bold tracking-wider text-sig uppercase hover:bg-sig/20"
            style={{ borderRadius: "10px" }}
          >
            <IcScan size={15} /> Vai alla lettura
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((c) => {
            const active = c.id === activeId;
            const tone = TONE_BY_KIND[c.kind];
            return (
              <article
                key={c.id}
                className={`tile-lift relative flex flex-col border bg-hull p-4 ${
                  active ? "border-sig/70 shadow-[0_0_0_1px_rgba(255,180,84,0.25)]" : "border-line"
                }`}
                style={{ borderRadius: "18px" }}
              >
                {active && (
                  <span
                    className="font-tech absolute top-3 right-3 border border-sig/60 bg-sig/10 px-2 py-0.5 text-[9.5px] tracking-[0.2em] text-sig"
                    style={{ borderRadius: "6px" }}
                  >
                    IN USO
                  </span>
                )}

                <button
                  onClick={() => onSelect(c.id)}
                  className="text-left"
                  title="Seleziona come scheda attiva"
                >
                  <CoilTag tone={tone} className="w-full max-w-[210px]" />
                  <h3 className="font-display mt-3 text-lg leading-tight font-bold text-ink">
                    {c.name}
                  </h3>
                  <p className="font-tech mt-0.5 text-[12px] tracking-[0.14em] text-data">
                    {c.uid}
                  </p>
                </button>

                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <span className="font-tech border border-line bg-panel px-2 py-0.5 text-[10px] tracking-wider text-dim" style={{ borderRadius: "6px" }}>
                    {c.label}
                  </span>
                  {c.real && (
                    <span className="font-tech border border-ok/50 bg-ok/10 px-2 py-0.5 text-[10px] tracking-wider text-ok" style={{ borderRadius: "6px" }}>
                      LETTA DAL VIVO
                    </span>
                  )}
                  {c.emulable && (
                    <span className="font-tech border border-ok/50 bg-ok/10 px-2 py-0.5 text-[10px] tracking-wider text-ok" style={{ borderRadius: "6px" }}>
                      HCE OK
                    </span>
                  )}
                </div>

                <p className="font-tech mt-2.5 text-[10.5px] tracking-wide text-faint">
                  {c.uses > 0 && c.lastUsedAt
                    ? `${c.uses} aperture · ultima ${formatDate(c.lastUsedAt)} ${formatTime(c.lastUsedAt)}`
                    : `salvata ${formatDate(c.createdAt)} · mai usata`}
                </p>

                <div className="mt-3 flex gap-2 border-t border-line pt-3">
                  <button
                    onClick={() => onEmulate(c.id)}
                    className="press font-display flex flex-1 items-center justify-center gap-2 border border-sig/70 bg-sig/10 px-3 py-2 text-[12px] font-bold tracking-wider text-sig uppercase hover:bg-sig/20"
                    style={{ borderRadius: "9px" }}
                  >
                    <IcPlay size={13} /> Emula
                  </button>
                  {confirmId === c.id ? (
                    <button
                      onClick={() => {
                        onDelete(c.id);
                        setConfirmId(null);
                      }}
                      className="press font-display border border-err bg-err/15 px-3 py-2 text-[12px] font-bold tracking-wider text-err uppercase"
                      style={{ borderRadius: "9px" }}
                    >
                      Confermi?
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setConfirmId(c.id);
                        window.setTimeout(() => setConfirmId((v) => (v === c.id ? null : v)), 2600);
                      }}
                      className="press border border-line bg-panel px-3 py-2 text-dim hover:border-err/60 hover:text-err"
                      style={{ borderRadius: "9px" }}
                      title="Elimina scheda"
                    >
                      <IcTrash size={14} />
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
