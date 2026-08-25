import { useEffect, useRef, useState } from "react";
import {
  NfcCard,
  hasWebNfc,
  makeRealCard,
  makeSimCard,
  startRealScan,
} from "../lib/nfc";
import { CoilTag, IcAlert, IcCheck, IcPlay, IcScan, IcX, Led, SectionHead } from "./ui";

type Phase = "idle" | "detect" | "handshake" | "reading" | "done" | "error";

const PHASE_MSG: Record<Phase, string> = {
  idle: "Sistema pronto · appoggia una scheda al lettore",
  detect: "Variazione di campo rilevata…",
  handshake: "Handshake ISO 14443-A · anti-collisione…",
  reading: "Lettura blocchi in corso…",
  done: "Lettura completata · scheda identificata",
  error: "Errore di comunicazione con la scheda",
};

const PHASE_COLOR: Record<Phase, string> = {
  idle: "text-dim",
  detect: "text-data",
  handshake: "text-data",
  reading: "text-sig",
  done: "text-ok",
  error: "text-err",
};

export default function ScanPad({
  cardsCount,
  onSave,
}: {
  cardsCount: number;
  onSave: (card: NfcCard, name: string) => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [block, setBlock] = useState(0);
  const [totalBlocks, setTotalBlocks] = useState(64);
  const [draft, setDraft] = useState<NfcCard | null>(null);
  const [name, setName] = useState("");
  const [realMode, setRealMode] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const timers = useRef<number[]>([]);
  const interval = useRef<number | null>(null);
  const abortReal = useRef<(() => void) | null>(null);
  const webNfc = hasWebNfc();

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const stopAll = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (interval.current) {
      clearInterval(interval.current);
      interval.current = null;
    }
    if (abortReal.current) {
      abortReal.current();
      abortReal.current = null;
    }
  };

  useEffect(() => stopAll, []);

  const reset = () => {
    stopAll();
    setPhase("idle");
    setBlock(0);
    setDraft(null);
    setErrMsg("");
  };

  /* ------------------------- scansione demo ------------------------- */
  const runSim = () => {
    stopAll();
    setDraft(null);
    setBlock(0);
    setErrMsg("");
    const card = makeSimCard("");
    const total = card.kind === "mifare4k" ? 256 : card.kind === "ntag" ? 135 : 64;
    setTotalBlocks(total);
    setPhase("detect");

    later(() => {
      setPhase("handshake");
      setDraft(card);
    }, 750);

    later(() => {
      setPhase("reading");
      let b = 0;
      interval.current = window.setInterval(() => {
        b += 2 + Math.floor(Math.random() * 5);
        if (b >= total) {
          if (interval.current) clearInterval(interval.current);
          interval.current = null;
          setBlock(total);
          // piccolo tasso di fallimento: rende lo strumento "vero"
          if (Math.random() < 0.07) {
            setErrMsg("AUTH sector 7 negata · chiave A non corrispondente");
            setPhase("error");
          } else {
            setPhase("done");
          }
        } else {
          setBlock(b);
        }
      }, 34);
    }, 1550);
  };

  /* ------------------------ scansione reale ------------------------- */
  const runReal = () => {
    stopAll();
    setDraft(null);
    setBlock(0);
    setErrMsg("");
    setPhase("detect");
    abortReal.current = startRealScan(
      ({ serial, payload }) => {
        abortReal.current = null;
        const card = makeRealCard(serial, payload, "");
        setDraft(card);
        setTotalBlocks(1);
        setBlock(1);
        setPhase("done");
      },
      (msg) => {
        abortReal.current = null;
        setErrMsg(msg);
        setPhase("error");
      }
    );
  };

  const start = () => (realMode ? runReal() : runSim());

  const save = () => {
    if (!draft) return;
    const finalName = name.trim() || `Porta ${cardsCount + 1}`;
    onSave({ ...draft, name: finalName }, finalName);
    setName("");
    reset();
  };

  const busy = phase === "detect" || phase === "handshake" || phase === "reading";
  const pct = totalBlocks ? Math.min(100, Math.round((block / totalBlocks) * 100)) : 0;

  return (
    <section>
      <SectionHead
        kicker="01 · Lettura"
        title="Scanner NFC"
        right={
          <div className="flex items-center gap-4">
            <Led color="#4ade80" on label="PWR" />
            <Led color="#56d4e8" on={busy} label="CAMPO" />
            <Led color="#ff6b6b" on={phase === "error"} label="ERR" />
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.12fr_1fr]">
        {/* ------------------------- dispositivo ------------------------ */}
        <div className="border border-line bg-hull p-4 sm:p-5" style={{ borderRadius: "22px" }}>
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <p className="font-display text-sm font-bold tracking-wide text-ink">
                LETTORE ISDECK-13
              </p>
              <p className="font-tech text-[10px] tracking-[0.22em] text-faint">
                13.56 MHZ · ISO 14443-A/B · NFC-F
              </p>
            </div>
            <span
              className={`font-tech border px-2 py-1 text-[10px] tracking-[0.18em] ${
                realMode ? "border-ok/50 text-ok" : "border-sig/40 text-sig"
              }`}
              style={{ borderRadius: "6px" }}
            >
              {realMode ? "MODALITÀ REALE" : "MODALITÀ DEMO"}
            </span>
          </div>

          {/* piano di lettura */}
          <div
            className="relative mt-4 flex h-64 items-center justify-center overflow-hidden sm:h-72"
            style={{
              borderRadius: "16px",
              background:
                "radial-gradient(420px 240px at 50% 42%, rgba(86,212,232,0.10), transparent 70%), #0d1626",
              boxShadow: "inset 0 0 0 1px #23344f, inset 0 18px 40px rgba(0,0,0,0.45)",
            }}
          >
            {/* crocicchio di mira */}
            <div className="absolute inset-0 opacity-40">
              <div className="absolute top-1/2 left-4 right-4 h-px bg-line" />
              <div className="absolute top-4 bottom-4 left-1/2 w-px bg-line" />
            </div>

            {/* onde NFC */}
            {busy && (
              <div className="relative h-44 w-44">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={`wave ${phase === "reading" ? "wave-hot" : ""}`}
                    style={{ animationDelay: `${i * 0.55}s` }}
                  />
                ))}
              </div>
            )}

            {/* tessera */}
            {phase !== "idle" && (
              <div
                className={`absolute w-40 sm:w-48 ${phase === "reading" ? "tag-jitter" : "tag-in"}`}
                style={{ transform: "translateY(-4px)" }}
              >
                <CoilTag tone={phase === "error" ? "dim" : phase === "done" ? "ok" : "sig"} className="w-full drop-shadow-[0_14px_24px_rgba(0,0,0,0.5)]" />
                {draft && phase !== "reading" && (
                  <p className="font-tech mt-2 text-center text-[11px] tracking-[0.2em] text-dim">
                    UID {draft.uid}
                  </p>
                )}
              </div>
            )}

            {phase === "idle" && (
              <div className="text-center">
                <IcScan size={34} className="mx-auto text-faint" />
                <p className="font-tech mt-3 text-[11px] tracking-[0.22em] text-faint uppercase">
                  Zona di lettura
                </p>
              </div>
            )}
          </div>

          {/* barra di avanzamento */}
          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <p className={`font-tech text-[11px] tracking-[0.14em] ${PHASE_COLOR[phase]}`}>
                {phase === "error" ? errMsg : PHASE_MSG[phase]}
                {busy && <span className="blink">▌</span>}
              </p>
              <p className="font-tech text-[11px] text-dim">
                {phase === "reading" ? `BLOCCO ${block}/${totalBlocks}` : busy ? "…" : ""}
              </p>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden bg-panel" style={{ borderRadius: "4px" }}>
              <div
                className="h-full transition-all duration-150"
                style={{
                  width: `${busy || phase === "done" ? pct : 0}%`,
                  background: phase === "done" ? "#4ade80" : "linear-gradient(90deg,#ff8a3d,#ffb454)",
                  borderRadius: "4px",
                }}
              />
            </div>
          </div>

          {/* comandi */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {phase !== "done" ? (
              <button
                onClick={busy ? reset : start}
                className={`press font-display flex items-center gap-2 border px-5 py-2.5 text-sm font-bold tracking-wider uppercase ${
                  busy
                    ? "border-err/60 bg-err/10 text-err"
                    : "border-sig bg-sig/10 text-sig hover:bg-sig/20"
                }`}
                style={{ borderRadius: "10px" }}
              >
                {busy ? <IcX size={15} /> : <IcPlay size={15} />}
                {busy ? "Annulla" : "Avvia lettura"}
              </button>
            ) : (
              <button
                onClick={reset}
                className="press font-display flex items-center gap-2 border border-line bg-panel px-5 py-2.5 text-sm font-bold tracking-wider text-dim uppercase hover:border-line2 hover:text-ink"
                style={{ borderRadius: "10px" }}
              >
                <IcScan size={15} /> Nuova scansione
              </button>
            )}

            {phase === "error" && (
              <button
                onClick={start}
                className="press font-display border border-line bg-panel px-5 py-2.5 text-sm font-bold tracking-wider text-ink uppercase hover:border-line2"
                style={{ borderRadius: "10px" }}
              >
                Riprova
              </button>
            )}

            {/* toggle modalità reale */}
            <button
              onClick={() => {
                if (busy || !webNfc) return;
                setRealMode((v) => !v);
                reset();
              }}
              className="ml-auto flex items-center gap-2"
              title={webNfc ? "Questo browser supporta il Web NFC" : "Web NFC non supportato: disponibile solo la demo"}
            >
              <span className="font-tech text-[10px] tracking-[0.18em] text-faint uppercase">
                Lettore reale
              </span>
              <span
                className={`relative h-5 w-10 border transition-colors ${
                  realMode ? "border-ok/70 bg-ok/15" : "border-line bg-panel"
                } ${webNfc ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
                style={{ borderRadius: "999px" }}
              >
                <span
                  className={`absolute top-0.5 h-3.5 w-3.5 transition-all ${
                    realMode ? "left-[22px] bg-ok" : "left-0.5 bg-faint"
                  }`}
                  style={{ borderRadius: "999px" }}
                />
              </span>
            </button>
          </div>

          {!webNfc && (
            <p className="font-tech mt-3 text-[10.5px] leading-relaxed text-faint">
              // Web NFC rilevato: {webNfc ? "sì" : "no"} — su questo browser la lettura è
              simulata. Apri l'app in Chrome su Android con NFC attivo per leggere tag reali.
            </p>
          )}
        </div>

        {/* --------------------------- referto -------------------------- */}
        <div
          className="flex flex-col border border-line bg-hull p-4 sm:p-5"
          style={{ borderRadius: "22px" }}
        >
          <p className="font-tech text-[10px] tracking-[0.3em] text-faint uppercase">
            Referto scheda
          </p>

          {!draft ? (
            <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
              <p className="font-tech text-sm text-dim">
                <span className="blink text-data">▸</span> in attesa di dati…
              </p>
              <p className="mt-2 max-w-[240px] text-[13px] text-faint">
                Avvia una lettura: UID, tipo di chip e dump dei blocchi compariranno qui.
              </p>
            </div>
          ) : (
            <div className="reveal-line mt-3 flex-1">
              {/* UID grande */}
              <div className="border border-data/30 bg-data/5 px-4 py-3" style={{ borderRadius: "12px" }}>
                <p className="font-tech text-[10px] tracking-[0.26em] text-data/80 uppercase">UID</p>
                <p className="font-tech mt-1 text-xl font-bold tracking-[0.12em] text-ink sm:text-2xl">
                  {draft.uid}
                </p>
              </div>

              {/* specifiche */}
              <dl className="mt-3 grid grid-cols-2 gap-px overflow-hidden border border-line bg-line sm:grid-cols-3" style={{ borderRadius: "10px" }}>
                {[
                  ["TIPO", draft.label],
                  ["SAK", draft.sak],
                  ["ATQA", draft.atqa],
                  ["SETTORI", draft.sectors],
                  ["BLOCCHI", draft.blocks],
                  ["MEMORIA", draft.memory],
                ].map(([k, v]) => (
                  <div key={k} className="bg-hull px-3 py-2">
                    <dt className="font-tech text-[9.5px] tracking-[0.2em] text-faint">{k}</dt>
                    <dd className="font-tech mt-0.5 text-[12.5px] font-medium text-ink">{v}</dd>
                  </div>
                ))}
              </dl>

              {/* dump hex */}
              <div className="mt-3 overflow-hidden border border-line" style={{ borderRadius: "10px" }}>
                <div className="flex items-center justify-between bg-panel px-3 py-1.5">
                  <span className="font-tech text-[10px] tracking-[0.2em] text-dim">
                    SETTORE 0 · PRIMI 4 BLOCCHI
                  </span>
                  <span className="font-tech text-[10px] text-faint">HEX</span>
                </div>
                <div className="overflow-x-auto bg-[#0d1626] px-3 py-2">
                  {draft.dump.map((row, i) => (
                    <p
                      key={i}
                      className={`reveal-line font-tech text-[11px] whitespace-nowrap ${
                        i === 0 ? "text-sig" : i === 3 ? "text-faint" : "text-dim"
                      }`}
                      style={{ animationDelay: `${i * 120}ms` }}
                    >
                      <span className="mr-3 text-faint">B{i}</span>
                      {row}
                    </p>
                  ))}
                  {draft.payload && (
                    <p className="reveal-line font-tech mt-1 text-[11px] text-data" style={{ animationDelay: "480ms" }}>
                      <span className="mr-3 text-faint">NDEF</span>
                      {draft.payload}
                    </p>
                  )}
                </div>
              </div>

              {/* avviso emulazione */}
              {!draft.emulable && phase === "done" && (
                <div className="mt-3 flex items-start gap-2 border border-sig/40 bg-sig/8 px-3 py-2.5" style={{ borderRadius: "10px" }}>
                  <IcAlert size={15} className="mt-0.5 shrink-0 text-sig" />
                  <p className="text-[12px] leading-snug text-sig/90">
                    <strong className="font-semibold">{draft.label}</strong> non è emulabile via
                    HCE su Android standard. Vedi la scheda <em>Note tecniche</em>.
                  </p>
                </div>
              )}
              {draft.emulable && phase === "done" && (
                <div className="mt-3 flex items-center gap-2 border border-ok/40 bg-ok/8 px-3 py-2.5" style={{ borderRadius: "10px" }}>
                  <IcCheck size={15} className="text-ok" />
                  <p className="text-[12px] text-ok/90">
                    Chip ISO-DEP: emulabile davvero con Host Card Emulation.
                  </p>
                </div>
              )}

              {/* salvataggio */}
              {phase === "done" && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={`es. Porta ufficio ${cardsCount + 1}`}
                    className="min-w-0 flex-1 border border-line bg-panel px-3 py-2.5 text-sm text-ink placeholder:text-faint focus:border-data/60 focus:outline-none"
                    style={{ borderRadius: "10px" }}
                  />
                  <button
                    onClick={save}
                    className="press font-display flex items-center gap-2 border border-ok/70 bg-ok/15 px-5 py-2.5 text-sm font-bold tracking-wider text-ok uppercase hover:bg-ok/25"
                    style={{ borderRadius: "10px" }}
                  >
                    <IcCheck size={15} /> Salva nel portachiavi
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
