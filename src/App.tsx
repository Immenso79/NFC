import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  LogEntry,
  NfcCard,
  Toast,
  ToastKind,
  formatTime,
  hasWebNfc,
  loadActive,
  loadCards,
  loadLog,
  saveActive,
  saveCards,
  saveLog,
  uid,
} from "./lib/nfc";
import ScanPad from "./components/ScanPad";
import Keyring from "./components/Keyring";
import DoorOpener from "./components/DoorOpener";
import AccessLog from "./components/AccessLog";
import TechNotes from "./components/TechNotes";
import { IcDoor, IcDownload, IcInfo, IcKey, IcList, IcNfc, IcScan, ToastStack } from "./components/ui";

type Tab = "scan" | "keyring" | "door" | "log" | "notes";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const TABS: { id: Tab; label: string; icon: (p: { size?: number }) => ReactNode }[] = [
  { id: "scan", label: "Lettura", icon: (p) => <IcScan {...p} /> },
  { id: "keyring", label: "Portachiavi", icon: (p) => <IcKey {...p} /> },
  { id: "door", label: "Emulazione", icon: (p) => <IcDoor {...p} /> },
  { id: "log", label: "Registro", icon: (p) => <IcList {...p} /> },
  { id: "notes", label: "Note tecniche", icon: (p) => <IcInfo {...p} /> },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("scan");
  const [cards, setCards] = useState<NfcCard[]>(loadCards);
  const [log, setLog] = useState<LogEntry[]>(loadLog);
  const [activeId, setActiveId] = useState<string | null>(loadActive);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [clock, setClock] = useState(() => new Date());
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const webNfc = useMemo(hasWebNfc, []);

  useEffect(() => saveCards(cards), [cards]);
  useEffect(() => saveLog(log), [log]);
  useEffect(() => saveActive(activeId), [activeId]);

  useEffect(() => {
    const t = window.setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  /* -------- prompt di installazione PWA (Chrome su Android) -------- */
  useEffect(() => {
    const onBip = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstallEvt(null);
      toast("ok", "App installata sulla schermata Home");
    };
    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doInstall = async () => {
    if (!installEvt) return;
    await installEvt.prompt();
    const choice = await installEvt.userChoice;
    if (choice.outcome === "accepted") toast("ok", "Installazione avviata");
    else toast("warn", "Installazione annullata — puoi riprovare dal menu di Chrome");
    setInstallEvt(null);
  };

  const toast = (kind: ToastKind, message: string) => {
    const id = uid();
    setToasts((ts) => [...ts.slice(-3), { id, kind, message }]);
    window.setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 3200);
  };

  const pushLog = (kind: LogEntry["kind"], message: string) =>
    setLog((l) => [{ id: uid(), at: Date.now(), kind, message }, ...l].slice(0, 120));

  const activeCard = cards.find((c) => c.id === activeId) ?? null;
  const totalOpens = cards.reduce((a, c) => a + c.uses, 0);
  const lastOpen = cards
    .map((c) => c.lastUsedAt ?? 0)
    .reduce((a, b) => Math.max(a, b), 0);

  /* ------------------------------ azioni ------------------------------ */

  const handleSave = (card: NfcCard) => {
    setCards((cs) => [card, ...cs]);
    setActiveId(card.id);
    pushLog("save", `Scheda «${card.name}» salvata (${card.label} · UID ${card.uid})`);
    toast("ok", `«${card.name}» aggiunta al portachiavi`);
    if (!card.emulable) {
      window.setTimeout(
        () => toast("warn", "Chip non emulabile via HCE — leggi le Note tecniche"),
        450
      );
    }
  };

  const handleDelete = (id: string) => {
    const victim = cards.find((c) => c.id === id);
    setCards((cs) => cs.filter((c) => c.id !== id));
    if (activeId === id) setActiveId(null);
    if (victim) {
      pushLog("delete", `Scheda «${victim.name}» eliminata dal portachiavi`);
      toast("warn", `«${victim.name}» eliminata`);
    }
  };

  const handleSelect = (id: string) => {
    setActiveId(id);
    const c = cards.find((x) => x.id === id);
    if (c) toast("ok", `«${c.name}» è ora la scheda in emulazione`);
  };

  const handleEmulate = (id: string) => {
    setActiveId(id);
    setTab("door");
  };

  const handleOpenSuccess = (cardId: string) => {
    const now = Date.now();
    setCards((cs) =>
      cs.map((c) => (c.id === cardId ? { ...c, uses: c.uses + 1, lastUsedAt: now } : c))
    );
    const c = cards.find((x) => x.id === cardId);
    pushLog("open", `Porta aperta con «${c?.name ?? "scheda"}» alle ${formatTime(now)}`);
    toast("ok", "Porta aperta · accesso registrato");
  };

  /* ------------------------------- render ------------------------------ */

  return (
    <div className="lab-bg relative min-h-screen">
      {/* sfondo ambientale */}
      <div className="lab-grid pointer-events-none fixed inset-0" aria-hidden="true" />
      <div className="scanline pointer-events-none fixed inset-x-0 top-0 z-0" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        {/* --------------------------- intestazione --------------------------- */}
        <header className="flex flex-wrap items-center gap-x-5 gap-y-3 pt-6 pb-5">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center border border-sig/60 bg-sig/10 text-sig shadow-[0_0_24px_rgba(255,180,84,0.18)]"
              style={{ borderRadius: "12px" }}
            >
              <IcNfc size={24} />
            </span>
            <div>
              <h1 className="font-display text-2xl leading-none font-bold tracking-tight text-ink">
                TAG<span className="text-sig">KEY</span>
              </h1>
              <p className="font-tech mt-1 text-[10px] tracking-[0.34em] text-faint uppercase">
                Leggi · Salva · Apri
              </p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {installEvt && (
              <button
                onClick={doInstall}
                title="Installa TAGKEY come app su questo dispositivo"
                className="press font-display flex items-center gap-1.5 border border-ok/60 bg-ok/10 px-3 py-1.5 text-[10.5px] font-bold tracking-[0.14em] text-ok uppercase hover:bg-ok/20"
                style={{ borderRadius: "999px" }}
              >
                <IcDownload size={13} /> Installa
              </button>
            )}
            <span
              className={`font-tech hidden items-center gap-1.5 border px-2.5 py-1 text-[10px] tracking-[0.18em] sm:flex ${
                webNfc ? "border-ok/50 text-ok" : "border-line text-faint"
              }`}
              style={{ borderRadius: "999px" }}
            >
              <span className={`led ${webNfc ? "led-on" : ""}`} style={{ backgroundColor: webNfc ? "#4ade80" : "#5b6f8a", color: webNfc ? "#4ade80" : "#5b6f8a" }} />
              {webNfc ? "WEB NFC ATTIVO" : "WEB NFC ASSENTE"}
            </span>
            <span className="font-tech border border-line bg-panel px-2.5 py-1 text-[11px] tracking-[0.14em] text-dim" style={{ borderRadius: "8px" }}>
              {clock.toLocaleTimeString("it-IT")}
            </span>
          </div>
        </header>

        {/* ------------------------- barra statistiche ------------------------- */}
        <div
          className="mb-6 grid grid-cols-3 divide-x divide-line overflow-hidden border border-line bg-hull/70"
          style={{ borderRadius: "14px" }}
        >
          {[
            { k: "SCHEDE SALVATE", v: String(cards.length).padStart(2, "0") },
            { k: "APERTURE TOTALI", v: String(totalOpens).padStart(2, "0") },
            { k: "ULTIMO VARCO", v: lastOpen ? formatTime(lastOpen) : "—" },
          ].map((s) => (
            <div key={s.k} className="px-4 py-3">
              <p className="font-tech text-[9px] tracking-[0.22em] text-faint sm:text-[10px]">{s.k}</p>
              <p className="font-display mt-0.5 text-xl font-bold text-ink sm:text-2xl">{s.v}</p>
            </div>
          ))}
        </div>

        {/* ------------------------------ tabs ------------------------------ */}
        <nav
          className="sticky top-2 z-20 mb-7 flex gap-1 overflow-x-auto border border-line bg-hull/90 p-1.5 backdrop-blur-md"
          style={{ borderRadius: "14px" }}
          aria-label="Sezioni dell'app"
        >
          {TABS.map((t) => {
            const on = tab === t.id;
            const badge =
              t.id === "keyring" ? cards.length : t.id === "log" ? log.length : null;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`press font-display relative flex shrink-0 items-center gap-2 px-3.5 py-2.5 text-[12.5px] font-bold tracking-wider uppercase ${
                  on ? "bg-sig text-abyss" : "text-dim hover:bg-panel hover:text-ink"
                }`}
                style={{ borderRadius: "9px" }}
              >
                {t.icon({ size: 15 })}
                {t.label}
                {badge !== null && badge > 0 && (
                  <span
                    className={`font-tech px-1.5 py-px text-[9.5px] leading-4 ${
                      on ? "bg-abyss/15 text-abyss" : "bg-panel2 text-data"
                    }`}
                    style={{ borderRadius: "6px" }}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* ---------------------------- contenuto ---------------------------- */}
        <main className="reveal-line" key={tab}>
          {tab === "scan" && <ScanPad cardsCount={cards.length} onSave={handleSave} />}
          {tab === "keyring" && (
            <Keyring
              cards={cards}
              activeId={activeId}
              onSelect={handleSelect}
              onEmulate={handleEmulate}
              onDelete={handleDelete}
              onGoScan={() => setTab("scan")}
            />
          )}
          {tab === "door" && (
            <DoorOpener
              card={activeCard}
              onSuccess={handleOpenSuccess}
              onGoKeyring={() => setTab("keyring")}
              onGoScan={() => setTab("scan")}
            />
          )}
          {tab === "log" && (
            <AccessLog
              log={log}
              onClear={() => {
                setLog([]);
                toast("warn", "Registro svuotato");
              }}
            />
          )}
          {tab === "notes" && <TechNotes />}
        </main>

        {/* ------------------------------ footer ------------------------------ */}
        <footer className="mt-14 border-t border-line pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-tech text-[10.5px] tracking-[0.14em] text-faint">
              TAGKEY v1.0 · prototipo dimostrativo · dati salvati solo nel tuo browser
            </p>
            <p className="font-tech text-[10.5px] tracking-[0.14em] text-faint">
              ISO 14443-A/B · NFC-F · NDEF · HCE
            </p>
          </div>
          <p className="mt-2 max-w-3xl text-[12px] leading-relaxed text-faint">
            Usa TAGKEY solo con schede di porte a cui hai legittimo accesso. L'emulazione reale
            di MIFARE Classic non è supportata da Android standard: questa app la simula a scopo
            didattico.
          </p>
        </footer>
      </div>

      <ToastStack toasts={toasts} />
    </div>
  );
}
