# TAGKEY · Da web app ad APK Android

L'app che hai davanti è una web app (React + Vite). Hai **tre strade** per averla sul telefono,
dalla più veloce alla più "vera".

---

## Strada 1 — PWA (consigliata per iniziare · 1 minuto · nessun APK)

L'app è già una **Progressive Web App**: manifest, icone e service worker sono integrati.

1. Pubblica la cartella `dist/` (dopo `npm run build`) su un hosting **HTTPS** qualsiasi:
   - **Netlify Drop** → https://app.netlify.com/drop (trascini la cartella, URL istantaneo)
   - **GitHub Pages**, **Vercel**, **Cloudflare Pages**…
2. Sul telefono Android apri l'URL in **Chrome**.
3. Menu `⋮` → **"Installa app"** (oppure premi il pulsante **INSTALLA** che compare in alto a destra nell'app).
4. Fatto: icona in home screen, avvio a schermo intero, funziona anche offline.

> **NFC nella PWA**: il Web NFC funziona in Chrome Android (89+) anche installata come PWA.
> Ricorda di attivare NFC e "NFC senza contatto" nelle impostazioni Android.

---

## Strada 2 — Capacitor (APK reale installabile · ~15 minuti)

Trasforma il progetto in un'app Android nativa (WebView) e produce un **APK** da installare
direttamente o pubblicare sul Play Store.

### Prerequisiti sul PC

- **Node.js** 18+
- **Android Studio** (https://developer.android.com/studio) — alla prima apertura scarica:
  - Android SDK **34**
  - JDK **17** (quello integrato in Android Studio va bene)

### Procedura

```bash
# 1. installa Capacitor nel progetto
npm i @capacitor/core @capacitor/android
npm i -D @capacitor/cli

# 2. inizializza (usa il tuo package ID, es. com.mionome.tagkey)
npx cap init TAGKEY com.mionome.tagkey --web-dir dist

# 3. compila la web app e crea il progetto Android
npm run build
npx cap add android
npx cap sync

# 4. apri in Android Studio
npx cap open android
```

In Android Studio: attendi la sincronizzazione Gradle, poi
**Build ▸ Build App Bundle(s)/APK(s) ▸ Build APK(s)**.
L'APK compare in `android/app/build/outputs/apk/debug/app-debug.apk`:
copialo sul telefono e installalo (consenti "Installa app sconosciute" per il file manager).

Ad ogni modifica al codice web: `npm run build && npx cap sync` e poi di nuovo Build APK.

### Permesso NFC

Apri `android/app/src/main/AndroidManifest.xml` e aggiungi dentro `<manifest>`:

```xml
<uses-permission android:name="android.permission.NFC" />
```

Il Web NFC dentro la WebView di Capacitor funziona su Android (è la stessa WebView di Chrome).

---

## Strada 3 — Bubblewrap / TWA (APK firmato · senza Android Studio)

Se l'app è già online in HTTPS (vedi Strada 1), Bubblewrap genera un **APK/AAB firmato**
che avvolge il sito in una Chrome custom tab "nativa":

```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://TUO-SITO/manifest.webmanifest
bubblewrap build
```

Alla fine trovi `app-release-signed.apk` pronto da installare o da caricare sul Play Store
(usa il file `.aab` per la pubblicazione). La prima esecuzione scarica da sola JDK e SDK.

---

## Nota importante sull'emulazione NFC

Impacchettare l'app come APK **non cambia** i limiti hardware descritti nelle Note tecniche:

- **Lettura NFC** → funziona nell'APK (Web NFC nella WebView).
- **Emulazione reale (HCE)** → Android espone solo il protocollo ISO-DEP. Le classiche
  tessere porta MIFARE non possono essere emulate da un telefono standard, né via web né via APK.
- Se vuoi l'emulazione reale di chip **ISO-DEP**, dentro il progetto Capacitor puoi scrivere un
  servizio Kotlin `HostApduService` e richiamarlo con un piccolo plugin: è l'unica strada
  nativa, e funziona solo con lettori che parlano ISO-DEP/Type 4.

L'emulazione mostrata in questa app è quindi una **simulazione dimostrativa** del flusso
(lettore → telefono → sblocco), pensata per prototipare l'esperienza.

---

## Risoluzione problemi

| Sintomo | Causa / rimedio |
|---|---|
| Pulsante INSTALLA non compare | Apri in Chrome Android, sito su HTTPS, NFC/connessione ok; oppure usa menu ⋮ → "Aggiungi a schermata Home" |
| Pagina bianca nell'APK | Controlla `webDir: "dist"` in `capacitor.config.ts` e rifai `npm run build && npx cap sync` |
| Gradle non sincronizza | Aggiorna Android Studio; File ▸ Invalidate Caches; JDK 17 |
| Web NFC non legge nulla | Impostazioni Android → NFC attivo; togli la cover spessa; avvicina il tag alla fotocamera/alto del telefono |
| APK non si installa | Impostazioni → Sicurezza → consenti installazione da "fonti sconosciute" per il file manager |

---

## In sintesi

- Voglio provarla subito sul telefono → **Strada 1 (PWA)**
- Voglio un file `.apk` da passare in giro → **Strada 2 (Capacitor)** o **Strada 3 (Bubblewrap)**
- Voglio che il telefono sostituisca davvero la tessera → possibile **solo** con chip ISO-DEP + servizio HCE nativo (fuori dal perimetro web)
