import type { ReactNode, SVGProps } from "react";
import type { Toast } from "../lib/nfc";

/* ------------------------------ icone ------------------------------ */

type IcProps = SVGProps<SVGSVGElement> & { size?: number };

const Svg = ({ size = 16, children, ...rest }: IcProps & { children: ReactNode }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...rest}
  >
    {children}
  </svg>
);

export const IcNfc = (p: IcProps) => (
  <Svg {...p}>
    <path d="M5.5 9.5a4.2 4.2 0 0 1 0 5" />
    <path d="M8.6 7a8 8 0 0 1 0 10" />
    <path d="M11.7 4.6a11.6 11.6 0 0 1 0 14.8" />
    <circle cx="17" cy="12" r="1.2" fill="currentColor" stroke="none" />
  </Svg>
);
export const IcScan = (p: IcProps) => (
  <Svg {...p}>
    <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
    <path d="M7 12h10" />
  </Svg>
);
export const IcKey = (p: IcProps) => (
  <Svg {...p}>
    <circle cx="8" cy="12" r="3.4" />
    <path d="M11.4 12H20M17 12v3M20 12v2.2" />
  </Svg>
);
export const IcDoor = (p: IcProps) => (
  <Svg {...p}>
    <path d="M4 21h16M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
    <circle cx="14.6" cy="12" r="1" fill="currentColor" stroke="none" />
  </Svg>
);
export const IcList = (p: IcProps) => (
  <Svg {...p}>
    <path d="M8 6h12M8 12h12M8 18h12" />
    <circle cx="4.5" cy="6" r="1" fill="currentColor" stroke="none" />
    <circle cx="4.5" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="4.5" cy="18" r="1" fill="currentColor" stroke="none" />
  </Svg>
);
export const IcInfo = (p: IcProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5" />
    <circle cx="12" cy="7.8" r="1" fill="currentColor" stroke="none" />
  </Svg>
);
export const IcTrash = (p: IcProps) => (
  <Svg {...p}>
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6.5 7l1 12a2 2 0 0 0 2 1.8h5a2 2 0 0 0 2-1.8l1-12" />
    <path d="M10 11v6M14 11v6" />
  </Svg>
);
export const IcPlay = (p: IcProps) => (
  <Svg {...p}>
    <path d="M8 5.5v13l11-6.5z" />
  </Svg>
);
export const IcCheck = (p: IcProps) => (
  <Svg {...p}>
    <path d="M4.5 12.5l5 5 10-11" />
  </Svg>
);
export const IcX = (p: IcProps) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);
export const IcAlert = (p: IcProps) => (
  <Svg {...p}>
    <path d="M12 4L2.8 20h18.4z" />
    <path d="M12 10v4.5" />
    <circle cx="12" cy="17.4" r="0.9" fill="currentColor" stroke="none" />
  </Svg>
);
export const IcClock = (p: IcProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Svg>
);
export const IcChip = (p: IcProps) => (
  <Svg {...p}>
    <rect x="7" y="7" width="10" height="10" rx="1.5" />
    <path d="M9.5 7V4M14.5 7V4M9.5 20v-3M14.5 20v-3M7 9.5H4M7 14.5H4M20 9.5h-3M20 14.5h-3" />
  </Svg>
);
export const IcDownload = (p: IcProps) => (
  <Svg {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="m7 10 5 5 5-5" />
    <path d="M12 15V3" />
  </Svg>
);
export const IcCopy = (p: IcProps) => (
  <Svg {...p}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" transform="translate(2 2)" />
  </Svg>
);

/* ------------------------------- LED ------------------------------- */

export function Led({ color, on, label }: { color: string; on: boolean; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={`led ${on ? "led-on" : ""}`}
        style={{ backgroundColor: on ? color : "#2e4263", color }}
      />
      <span className="font-tech text-[10px] tracking-[0.14em] text-dim">{label}</span>
    </span>
  );
}

/* ------------------------- tessera NFC (SVG) ------------------------ */

const TONES: Record<string, { coil: string; chip: string; body: string }> = {
  sig: { coil: "#ffb454", chip: "#ffb454", body: "rgba(255,180,84,0.07)" },
  data: { coil: "#56d4e8", chip: "#56d4e8", body: "rgba(86,212,232,0.07)" },
  ok: { coil: "#4ade80", chip: "#4ade80", body: "rgba(74,222,128,0.07)" },
  dim: { coil: "#5b6f8a", chip: "#8fa3bd", body: "rgba(91,111,138,0.08)" },
};

export function CoilTag({
  tone = "sig",
  className = "",
}: {
  tone?: keyof typeof TONES;
  className?: string;
}) {
  const t = TONES[tone] ?? TONES.sig;
  return (
    <svg viewBox="0 0 200 126" className={className} aria-hidden="true">
      <rect x="3" y="3" width="194" height="120" rx="14" fill={t.body} stroke={t.coil} strokeOpacity="0.5" strokeWidth="1.6" />
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={14 + i * 7}
          y={14 + i * 7}
          width={172 - i * 14}
          height={98 - i * 14}
          rx={10 - i}
          fill="none"
          stroke={t.coil}
          strokeOpacity={0.55 - i * 0.11}
          strokeWidth="1.3"
        />
      ))}
      <rect x="82" y="45" width="36" height="36" rx="5" fill="none" stroke={t.chip} strokeWidth="1.6" />
      <rect x="90" y="53" width="20" height="20" rx="2.5" fill={t.chip} fillOpacity="0.22" stroke={t.chip} strokeWidth="1.2" />
      <path d="M100 53v-8M90 63h-8M110 63h8M100 73v8" stroke={t.chip} strokeWidth="1.2" strokeOpacity="0.7" />
    </svg>
  );
}

/* --------------------------- intestazioni --------------------------- */

export function SectionHead({
  kicker,
  title,
  right,
}: {
  kicker: string;
  title: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="font-tech text-[11px] tracking-[0.3em] text-sig uppercase">{kicker}</p>
        <h2 className="font-display mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {title}
        </h2>
      </div>
      {right}
    </div>
  );
}

/* ------------------------------ toasts ------------------------------ */

const TOAST_STYLE: Record<Toast["kind"], { border: string; icon: ReactNode }> = {
  ok: { border: "border-ok/50", icon: <IcCheck size={15} className="text-ok" /> },
  warn: { border: "border-sig/50", icon: <IcAlert size={15} className="text-sig" /> },
  err: { border: "border-err/50", icon: <IcX size={15} className="text-err" /> },
};

export function ToastStack({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[min(92vw,340px)] flex-col gap-2">
      {toasts.map((t) => {
        const s = TOAST_STYLE[t.kind];
        return (
          <div
            key={t.id}
            className={`toast-in flex items-center gap-2.5 border ${s.border} bg-panel/95 px-3.5 py-2.5 shadow-xl shadow-black/40 backdrop-blur-sm`}
            style={{ borderRadius: "10px" }}
            role="status"
          >
            {s.icon}
            <p className="text-[13px] font-medium text-ink">{t.message}</p>
          </div>
        );
      })}
    </div>
  );
}
