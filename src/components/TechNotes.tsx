import type { ReactNode } from "react";
import { IcAlert, IcCheck, IcChip, IcNfc, IcX, SectionHead } from "./ui";

function Rule({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border ${
          ok ? "border-ok/60 text-ok" : "border-err/60 text-err"
        }`}
        style={{ borderRadius: "6px" }}
      >
        {ok ? <IcCheck size={11} /> : <IcX size={11} />}
      </span>
      <span className="text-[13.5px] leading-relaxed text-dim">{children}</span>
    </li>
  );
}

function TreeBox({
  tone,
  title,
  desc,
}: {
  tone: "ok" | "sig" | "err" | "data";
  title: string;
  desc: string;
}) {
  const tones = {
    ok: "border-ok/50 text-ok",
    sig: "border-sig/50 text-sig",
    err: "border-err/50 text-err",
    data: "border-data/50 text-data",
  } as const;
  return (
    <div className={`flex-1 border bg-hull px-4 py-3.5 ${tones[tone]}`} style={{ borderRadius: "14px" }}>
      <p className="font-display text-[13px] font-bold tracking-wide uppercase">{title}</p>
      <p className="mt-1 text-[12.5px] leading-snug text-dim">{desc}</p>
    </div>
  );
}

export default function TechNotes() {
  return (
    <section>
      <SectionHead kicker="05 · Note tecniche" title="Cosa può (e non può) fare Android" />

      <div className="grid gap-5 lg:grid-cols-2">
        {/* colonna 1 */}
        <div className="space-y-5">
          <div className="border border-line bg-hull p-5" style={{ borderRadius: "18px" }}>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center border border-ok/50 text-ok" style={{ borderRadius: "10px" }}>
                <IcNfc size={18} />
              </span>
              <h3 className="font-display text-lg font-bold text-ink">Leggere: sempre possibile</h3>
            </div>
            <ul className="mt-4 space-y-2.5">
              <Rule ok>
                <strong className="text-ink">Qualsiasi tessera 13.56 MHz</strong> (MIFARE, NTAG,
                DESFire, ISO-DEP) viene letta dall'antenna NFC del telefono: UID, tipo di chip e
                — se le chiavi lo permettono — il contenuto.
              </Rule>
              <Rule ok>
                <strong className="text-ink">Web NFC</strong>: Chrome su Android può leggere i
                tag NDEF direttamente dal browser, senza installare nulla. È la modalità
                "Lettore reale" dello scanner di questa app.
              </Rule>
              <Rule ok>
                Per i blocchi protetti di una MIFARE Classic serve la chiave A/B del settore:
                le schede porta usano quasi sempre chiavi personalizzate, non quelle di
                fabbrica.
              </Rule>
            </ul>
          </div>

          <div className="border border-line bg-hull p-5" style={{ borderRadius: "18px" }}>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center border border-err/50 text-err" style={{ borderRadius: "10px" }}>
                <IcChip size={18} />
              </span>
              <h3 className="font-display text-lg font-bold text-ink">Emulare: qui c'è il muro</h3>
            </div>
            <ul className="mt-4 space-y-2.5">
              <Rule ok={false}>
                <strong className="text-ink">MIFARE Classic (la classica tessera porta)</strong>{" "}
                non è emulabile: l'API HCE di Android supporta solo il protocollo ISO-DEP, e il
                controller NFC del telefono non può rispondere come una Type-A legacy senza
                root e driver NXP modificati.
              </Rule>
              <Rule ok={false}>
                <strong className="text-ink">Badge 125 kHz</strong> (EM4100, T5577):
                fisicamente impossibile. L'antenna del telefono oscilla a 13.56 MHz: non può
                nemmeno "vedere" quelle schede, figuriamoci replicarle.
              </Rule>
              <Rule ok>
                <strong className="text-ink">Chip ISO-DEP / Type 4</strong> (DESFire, alcune
                smart card): emulabili davvero con Host Card Emulation, anche da un'app web o
                nativa.
              </Rule>
            </ul>
          </div>
        </div>

        {/* colonna 2 */}
        <div className="space-y-5">
          <div className="border border-line bg-hull p-5" style={{ borderRadius: "18px" }}>
            <h3 className="font-tech text-[11px] tracking-[0.26em] text-sig uppercase">
              Albero di decisione · che scheda ho?
            </h3>
            <div className="mt-4 space-y-2.5">
              <TreeBox
                tone="data"
                title="Passo 1 · frequenza"
                desc="Avvicina la tessera al telefono: se non succede nulla, probabilmente è 125 kHz → non clonabile col telefono, punto."
              />
              <div className="flex justify-center text-faint">▼</div>
              <TreeBox
                tone="sig"
                title="Passo 2 · tipo di chip"
                desc="Se il telefono la legge, guarda il referto: MIFARE Classic → emulazione solo demo. NTAG → il lettore porta quasi mai la accetta. ISO-DEP → via libera all'HCE."
              />
              <div className="flex justify-center text-faint">▼</div>
              <TreeBox
                tone="ok"
                title="Passo 3 · risultato"
                desc="Solo ISO-DEP = il telefono può davvero aprire la porta. Negli altri casi servono le alternative qui sotto."
              />
            </div>
          </div>

          <div className="hazard border border-sig/50 p-5" style={{ borderRadius: "18px" }}>
            <h3 className="font-display text-lg font-bold text-sig">Alternative che funzionano davvero</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-[13.5px] leading-relaxed text-dim marker:text-sig">
              <li>
                <strong className="text-ink">Credenziali mobili ufficiali</strong>: molti
                sistemi (HID, Salto, ISEO) hanno l'app del produttore che trasforma il telefono
                in badge. Chiedi all'amministratore dello stabile.
              </li>
              <li>
                <strong className="text-ink">Wearable con emulazione MIFARE</strong>: alcuni
                smartband venduti in Cina emulano davvero le 13.56 MHz legacy al polso.
              </li>
              <li>
                <strong className="text-ink">Duplicatore dedicato</strong>: copia la tessera su
                un portachiavi T5577/UID: apri la porta senza la tessera originale, anche se non
                col telefono.
              </li>
            </ul>
          </div>

          <div className="border border-err/40 bg-err/5 p-5" style={{ borderRadius: "18px" }}>
            <div className="flex items-center gap-2">
              <IcAlert size={17} className="text-err" />
              <h3 className="font-display text-base font-bold text-err">Nota legale</h3>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-dim">
              Clona <strong className="text-ink">solo schede di porte a cui hai diritto di
              accesso</strong> (casa tua, ufficio, condominio). Duplicare credenziali altrui per
              varchi non autorizzati integra reati come l'accesso abusivo a sistema informatico
              e la violazione di domicilio. Questa app è un prototipo dimostrativo: i dati
              restano nel tuo browser.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
