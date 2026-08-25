/* ------------------------------------------------------------------ */
/*  TAGKEY · motore NFC: tipi, generazione dati demo, Web NFC, storage */
/* ------------------------------------------------------------------ */

export type CardKind = "mifare1k" | "mifare4k" | "ntag" | "isodep" | "ndef";

export interface NfcCard {
  id: string;
  name: string;
  kind: CardKind;
  label: string; // nome tecnico visualizzato
  uid: string; // "04 A1 B2 3C"
  sak: string;
  atqa: string;
  sectors: string;
  blocks: string;
  memory: string;
  frequency: string;
  dump: string[]; // righe hex da 16 byte
  emulable: boolean; // emulabile via HCE su Android standard
  real: boolean; // letta davvero via Web NFC
  payload?: string; // eventuale payload NDEF reale
  createdAt: number;
  lastUsedAt: number | null;
  uses: number;
}

export interface LogEntry {
  id: string;
  at: number;
  kind: "save" | "open" | "fail" | "delete" | "read";
  message: string;
}

export type ToastKind = "ok" | "warn" | "err";
export interface Toast {
  id: string;
  kind: ToastKind;
  message: string;
}

/* ----------------------------- helpers ---------------------------- */

const HEXC = "0123456789ABCDEF";

export const uid = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

const rb = () => HEXC[Math.floor(Math.random() * 16)] + HEXC[Math.floor(Math.random() * 16)];

const hexRow = (): string =>
  Array.from({ length: 16 }, rb).join(" ");

export const formatTime = (t: number): string =>
  new Date(t).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

export const formatDate = (t: number): string =>
  new Date(t).toLocaleDateString("it-IT", { day: "2-digit", month: "short" });

/* ---------------------- generazione schede demo -------------------- */

const KIND_META: Record<
  CardKind,
  { label: string; sak: string; atqa: string; sectors: string; blocks: string; memory: string; emulable: boolean }
> = {
  mifare1k: { label: "MIFARE Classic 1K", sak: "08", atqa: "0004", sectors: "16", blocks: "64", memory: "1024 B", emulable: false },
  mifare4k: { label: "MIFARE Classic 4K", sak: "18", atqa: "0002", sectors: "40", blocks: "256", memory: "4096 B", emulable: false },
  ntag: { label: "NTAG215", sak: "00", atqa: "0044", sectors: "—", blocks: "135 pag.", memory: "504 B", emulable: false },
  isodep: { label: "ISO-DEP · Type 4", sak: "20", atqa: "0344", sectors: "—", blocks: "—", memory: "variabile", emulable: true },
  ndef: { label: "NDEF · Web NFC", sak: "—", atqa: "—", sectors: "—", blocks: "—", memory: "—", emulable: false },
};

function pickKind(): CardKind {
  const r = Math.random();
  if (r < 0.58) return "mifare1k"; // le tessere porta sono quasi sempre MIFARE
  if (r < 0.74) return "mifare4k";
  if (r < 0.87) return "ntag";
  return "isodep";
}

function buildDump(uidBytes: string[], sak: string, atqa: string): string[] {
  const bccVal = uidBytes.reduce((a, b) => a ^ parseInt(b, 16), 0);
  const bcc = bccVal.toString(16).toUpperCase().padStart(2, "0");
  const a1 = atqa.slice(2, 4);
  const a0 = atqa.slice(0, 2);
  const block0 = [...uidBytes, bcc, sak, a1, a0, ...Array.from({ length: 7 }, rb)].join(" ");
  const trailer = "FF FF FF FF FF FF FF 07 80 69 FF FF FF FF FF FF";
  return [block0, hexRow(), hexRow(), trailer];
}

export function makeSimCard(name: string): NfcCard {
  const kind = pickKind();
  const meta = KIND_META[kind];
  const uidBytes = ["04", rb(), rb(), rb()]; // prefisso NXP plausibile
  return {
    id: uid(),
    name: name.trim() || "Scheda senza nome",
    kind,
    label: meta.label,
    uid: uidBytes.join(" "),
    sak: meta.sak,
    atqa: meta.atqa,
    sectors: meta.sectors,
    blocks: meta.blocks,
    memory: meta.memory,
    frequency: "13.56 MHz · ISO 14443-A",
    dump: buildDump(uidBytes, meta.sak, meta.atqa),
    emulable: meta.emulable,
    real: false,
    createdAt: Date.now(),
    lastUsedAt: null,
    uses: 0,
  };
}

export function makeRealCard(serial: string, payload: string, name: string): NfcCard {
  const clean = serial.replace(/:/g, " ").toUpperCase().trim();
  const uidBytes = clean ? clean.split(/\s+/) : ["04", rb(), rb(), rb()];
  return {
    id: uid(),
    name: name.trim() || "Tag reale",
    kind: "ndef",
    label: KIND_META.ndef.label,
    uid: uidBytes.join(" "),
    sak: "—",
    atqa: "—",
    sectors: "—",
    blocks: "—",
    memory: "—",
    frequency: "13.56 MHz · NDEF",
    dump: [
      [...uidBytes, ...Array.from({ length: Math.max(0, 16 - uidBytes.length) }, rb)]
        .slice(0, 16)
        .join(" "),
      ...(payload ? [] : [hexRow()]),
    ],
    emulable: false,
    real: true,
    payload: payload || undefined,
    createdAt: Date.now(),
    lastUsedAt: null,
    uses: 0,
  };
}

/* --------------------------- Web NFC reale ------------------------- */

export function hasWebNfc(): boolean {
  return typeof window !== "undefined" && "NDEFReader" in window;
}

export interface RealReading {
  serial: string;
  payload: string;
}

/** Avvia una scansione reale. Ritorna una funzione di abort. */
export function startRealScan(
  onReading: (r: RealReading) => void,
  onError: (msg: string) => void
): () => void {
  const Ctor = (window as unknown as { NDEFReader?: new () => {
    scan: (o: { signal: AbortSignal }) => Promise<void>;
    onreading: ((e: { serialNumber?: string; message?: { records?: Array<{ recordType: string; data?: ArrayBuffer; toText?: () => string }> } }) => void) | null;
    onerror: ((e: unknown) => void) | null;
  } }).NDEFReader;
  if (!Ctor) {
    onError("Web NFC non disponibile su questo browser");
    return () => undefined;
  }
  const reader = new Ctor();
  const ctrl = new AbortController();
  reader.onreading = (e) => {
    let payload = "";
    const rec = e.message?.records?.[0];
    if (rec) {
      if (rec.recordType === "text" && rec.data) {
        payload = new TextDecoder().decode(rec.data);
      } else if (rec.data) {
        payload = Array.from(new Uint8Array(rec.data).slice(0, 16))
          .map((b) => b.toString(16).toUpperCase().padStart(2, "0"))
          .join(" ");
      }
    }
    onReading({ serial: e.serialNumber ?? "", payload });
  };
  reader.onerror = () => onError("Scansione reale interrotta o negata");
  reader.scan({ signal: ctrl.signal }).catch(() =>
    onError("Permesso NFC negato — passo in modalità demo")
  );
  return () => ctrl.abort();
}

/* ---------------------------- storage ------------------------------ */

const K = {
  cards: "tagkey.cards.v1",
  log: "tagkey.log.v1",
  active: "tagkey.active.v1",
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export const loadCards = (): NfcCard[] => read<NfcCard[]>(K.cards, []);
export const saveCards = (c: NfcCard[]): void => {
  try { localStorage.setItem(K.cards, JSON.stringify(c)); } catch { /* quota */ }
};
export const loadLog = (): LogEntry[] => read<LogEntry[]>(K.log, []);
export const saveLog = (l: LogEntry[]): void => {
  try { localStorage.setItem(K.log, JSON.stringify(l.slice(0, 120))); } catch { /* quota */ }
};
export const loadActive = (): string | null => read<string | null>(K.active, null);
export const saveActive = (id: string | null): void => {
  try { localStorage.setItem(K.active, JSON.stringify(id)); } catch { /* quota */ }
};
