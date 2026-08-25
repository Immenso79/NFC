import { useEffect, useRef, useState } from "react";
import { NfcCard } from "../lib/nfc";
import { CoilTag, IcAlert, IcCheck, IcDoor, IcNfc, IcX, SectionHead } from "./ui";

type DoorState = "idle" | "run" | "open" | "fail";

export default function DoorOpener({
  card,
  onSuccess,
  onGoKeyring,
  onGoScan,
}: {
  card: NfcCard | null;
  onSuccess: (cardId: string) => void;
  onGoKeyring: () => void;
  onGoScan: () => void;
}) {
  const [state, setState] = useState<DoorState>("idle");
  const [step, setStep] = useState(0);
  const timers = useRef<number[]>([]);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
    },
    []
  );

  // se cambia la scheda attiva, si riparte da capo
  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setState("idle");
    setStep(0);
  }, [card?.id]);

  if (!card) {
    return (
      <section>
        <SectionHead kicker="03 · Emulazione" title="Apri la porta" />
        <div className="flex flex-col items-center border border-dashed border-line2 bg-hull/50 px-6 py-16 text-center" style={{ borderRadius: "20px" }}>
          <IcDoor size={40} className="text-faint" />
          <p className="font-display mt-5 text-lg font-bold text-ink">Nessuna scheda in emulazione</p>
          <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-dim">
            Scegli dal portachiavi la tessera da "indossare" col telefono, oppure fanne una
            scansione adesso.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={onGoKeyring}
              className="press font-display border border-sig bg-sig/10 px-5 py-2.5 text-sm font-bold tracking-wider text-sig uppercase hover:bg-sig/20"
              style={{ borderRadius: "10px" }}
            >
              Apri portachiavi
            </button>
            <button
              onClick={onGoScan}
              className="press font-display border border-line bg-panel px-5 py-2.5 text-sm font-bold tracking-wider text-dim uppercase hover:text-ink"
              style={{ borderRadius: "10px" }}
            >
              Nuova lettura
            </button>
          </div>
        </div>
      </section>
    );
  }

  const busy = state === "run";
  const unlocked = state === "open";

  const openDoor = () => {
    setState("run");
    setStep(0);
    later(() => setStep(1), 250); // campo RF
    later(() => setStep(2), 1000); // SELECT
    later(() => setStep(3), 1800); // AUTH
    later(() => {
      if (Math.random() < 0.06) {
        setState("fail");
      } else {
        setStep(4); // sblocco
        setState("open");
        onSuccess(card.id);
      }
    }, 2600);
  };

  const closeDoor = () => {
    setState("idle");
    setStep(0);
  };

  const lines: { text: string; tone: string }[] = [
    { text: "> campo RF 13.56 MHz rilevato · lettore sveglio", tone: "text-data" },
    { text: `> SELECT · UID ${card.uid}`, tone: "text-data" },
    { text: "> AUTHENTICATE key A · CRYPTO1 … OK", tone: "text-sig" },
    { text: "> SBLOCCO inviato · serratura aperta", tone: "text-ok" },
  ];
  const visible = state === "fail" ? 2 : step;

  return (
    <section>
      <SectionHead
        kicker="03 · Emulazione"
        title="Apri la porta"
        right={
          <div className="flex items-center gap-2">
            <span className="font-tech border border-line bg-panel px-2.5 py-1 text-[10px] tracking-[0.18em] text-dim" style={{ borderRadius: "6px" }}>
              SCHEDA ATTIVA
            </span>
            <span className="font-tech text-[12px] font-medium text-ink">{card.name}</span>
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
        {/* ----------------------------- scena ---------------------------- */}
        <div className="relative overflow-hidden border border-line bg-hull p-4 sm:p-5" style={{ borderRadius: "22px" }}>
          <div
            className="relative flex items-center justify-center overflow-hidden"
            style={{
              borderRadius: "16px",
              minHeight: "380px",
              background: "linear-gradient(180deg,#0e1728 0%,#0c1422 100%)",
              boxShadow: "inset 0 0 0 1px #23344f",
            }}
          >
            {/* pavimento */}
            <div
              className="absolute right-0 bottom-0 left-0 h-16"
              style={{ background: "linear-gradient(180deg, rgba(35,52,79,0.5), transparent)" }}
            />

            <svg viewBox="0 0 360 400" className="w-full max-w-[430px]" aria-hidden="true">
              {/* muro */}
              <rect x="0" y="0" width="360" height="400" fill="none" />
              {/* telaio */}
              <rect x="70" y="34" width="190" height="336" rx="6" fill="#1a2740" stroke="#2e4263" strokeWidth="2" />
              {/* porta */}
              <g
                className="door-swing"
                style={{ transform: unlocked ? "translateX(-10px) rotate(-5deg)" : "none" }}
              >
                <rect x="82" y="46" width="166" height="324" rx="3" fill="#24344f" stroke="#3a4f73" strokeWidth="1.5" />
                <rect x="98" y="66" width="134" height="120" rx="3" fill="none" stroke="#31446292" strokeWidth="2" />
                <rect x="98" y="206" width="134" height="140" rx="3" fill="none" stroke="#31446292" strokeWidth="2" />
                {/* maniglia */}
                <circle cx="232" cy="215" r="6.5" fill="#8fa3bd" />
                <rect x="226" y="222" width="13" height="4" rx="2" fill="#8fa3bd" />
              </g>

              {/* controtelaio + catenaccio */}
              <rect x="252" y="196" width="14" height="40" rx="2" fill="#141f33" stroke="#2e4263" />
              <g className="bolt-move" style={{ transform: unlocked ? "translateX(-30px)" : "none" }}>
                <rect x="228" y="206" width="34" height="20" rx="3" fill="#ffb454" stroke="#b97a2e" strokeWidth="1.2" />
                <rect x="234" y="212" width="10" height="8" rx="1.5" fill="#0b1220" opacity="0.35" />
              </g>

              {/* LED lettore */}
              <g className={unlocked ? "glow-ok" : state === "fail" ? "glow-err" : ""}>
                <circle
                  cx="306"
                  cy="150"
                  r="5"
                  fill={unlocked ? "#4ade80" : state === "fail" ? "#ff6b6b" : "#ff6b6b"}
                  opacity={unlocked || state === "fail" ? 1 : 0.75}
                />
              </g>
              {/* lettore a muro */}
              <rect x="288" y="164" width="36" height="64" rx="6" fill="#182540" stroke="#2e4263" strokeWidth="1.5" />
              <path d="M300 186a10 10 0 0 1 0 16M306 180a18 18 0 0 1 0 28" stroke="#56d4e8" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity={busy || unlocked ? 1 : 0.35} />
              <rect x="296" y="214" width="20" height="4" rx="2" fill="#2e4263" />

              {/* onde dal telefono quando attivo */}
              {(busy || unlocked) && (
                <g stroke="#56d4e8" fill="none" strokeLinecap="round" opacity="0.9">
                  <circle cx="270" cy="200" r="10" className="wave" style={{ animationDuration: "1.8s" }} />
                  <circle cx="270" cy="200" r="10" className="wave" style={{ animationDelay: "0.6s", animationDuration: "1.8s" }} />
                </g>
              )}

              {/* telefono */}
              <g style={{ transform: busy || unlocked ? "translateX(24px)" : "none", transition: "transform 0.6s ease" }}>
                <rect x="250" y="176" width="40" height="52" rx="7" fill="#101a2b" stroke={busy || unlocked ? "#56d4e8" : "#2e4263"} strokeWidth="1.6" />
                <rect x="256" y="184" width="28" height="30" rx="3" fill={busy || unlocked ? "rgba(86,212,232,0.15)" : "#141f33"} />
                <circle cx="270" cy="221" r="2" fill="#2e4263" />
              </g>
            </svg>

            {/* timbro di stato */}
            {unlocked && (
              <div
                className="reveal-line font-display absolute top-4 left-4 flex items-center gap-2 border border-ok/60 bg-ok/10 px-3 py-1.5 text-sm font-bold tracking-widest text-ok uppercase backdrop-blur-sm"
                style={{ borderRadius: "8px" }}
              >
                <IcCheck size={15} /> Aperta
              </div>
            )}
            {state === "fail" && (
              <div
                className="reveal-line font-display absolute top-4 left-4 flex items-center gap-2 border border-err/60 bg-err/10 px-3 py-1.5 text-sm font-bold tracking-widest text-err uppercase backdrop-blur-sm"
                style={{ borderRadius: "8px" }}
              >
                <IcX size={15} /> Negato
              </div>
            )}
          </div>

          {/* comando */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {state === "open" ? (
              <button
                onClick={closeDoor}
                className="press font-display flex items-center gap-2 border border-line bg-panel px-6 py-3 text-sm font-bold tracking-wider text-dim uppercase hover:text-ink"
                style={{ borderRadius: "12px" }}
              >
                <IcDoor size={16} /> Richiudi
              </button>
            ) : (
              <button
                onClick={openDoor}
                disabled={busy}
                className={`press font-display flex items-center gap-2.5 border px-7 py-3 text-base font-bold tracking-wider uppercase ${
                  busy
                    ? "cursor-wait border-data/50 bg-data/10 text-data"
                    : "border-sig bg-sig text-abyss hover:bg-sig2"
                }`}
                style={{ borderRadius: "12px" }}
              >
                <IcNfc size={18} />
                {busy ? "Telefono al lettore…" : "Avvicina e apri"}
              </button>
            )}
            {state === "fail" && !busy && (
              <button
                onClick={openDoor}
                className="press font-display border border-err/60 bg-err/10 px-5 py-3 text-sm font-bold tracking-wider text-err uppercase"
                style={{ borderRadius: "12px" }}
              >
                Riprova
              </button>
            )}
            <p className="font-tech ml-auto text-[10.5px] tracking-[0.14em] text-faint">
              UTILIZZI: {card.uses}
            </p>
          </div>

          {!card.emulable && (
            <div className="mt-3 flex items-start gap-2 border border-sig/40 bg-sig/8 px-3 py-2" style={{ borderRadius: "10px" }}>
              <IcAlert size={14} className="mt-0.5 shrink-0 text-sig" />
              <p className="text-[11.5px] leading-snug text-sig/90">
                Simulazione dimostrativa: {card.label} non può essere emulata davvero da un
                Android standard (solo i chip ISO-DEP lo possono). Dettagli in Note tecniche.
              </p>
            </div>
          )}
        </div>

        {/* ---------------------------- terminale --------------------------- */}
        <div className="flex flex-col border border-line bg-hull p-4 sm:p-5" style={{ borderRadius: "22px" }}>
          <div className="flex items-center justify-between border-b border-line pb-3">
            <p className="font-tech text-[10px] tracking-[0.3em] text-faint uppercase">
              Scambio con il lettore
            </p>
            <span
              className={`font-tech border px-2 py-0.5 text-[9.5px] tracking-[0.2em] ${
                unlocked
                  ? "border-ok/60 text-ok"
                  : state === "fail"
                    ? "border-err/60 text-err"
                    : busy
                      ? "border-data/60 text-data"
                      : "border-line text-faint"
              }`}
              style={{ borderRadius: "6px" }}
            >
              {unlocked ? "OK" : state === "fail" ? "FALLITA" : busy ? "IN CORSO" : "STANDBY"}
            </span>
          </div>

          <div className="font-tech mt-4 min-h-[190px] space-y-2.5 text-[12.5px]">
            {visible === 0 && (
              <p className="text-faint">
                <span className="blink text-data">▸</span> premi "avvicina e apri" e tieni il
                retro del telefono sul lettore…
              </p>
            )}
            {lines.slice(0, visible).map((l, i) => (
              <p key={i} className={`reveal-line ${l.tone}`}>
                {l.text}
              </p>
            ))}
            {state === "fail" && (
              <p className="reveal-line text-err">
                ✕ AUTH respinta dal lettore · riprova ad avvicinare il telefono
              </p>
            )}
            {unlocked && (
              <p className="reveal-line text-dim">
                — varco aperto alle{" "}
                <span className="text-ok">
                  {new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                </span>{" "}
                · registrata nel log
              </p>
            )}
          </div>

          {/* mini scheda attiva */}
          <div className="mt-auto flex items-center gap-3 border-t border-line pt-4">
            <div className="w-24 shrink-0">
              <CoilTag tone="sig" className="w-full" />
            </div>
            <div className="min-w-0">
              <p className="font-display truncate text-sm font-bold text-ink">{card.name}</p>
              <p className="font-tech text-[11px] tracking-[0.12em] text-data">{card.uid}</p>
              <p className="font-tech mt-0.5 text-[10px] tracking-wide text-faint">{card.label}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
