# TAGKEY · Da web app ad APK Android

Il progetto è **già predisposto**: manifest PWA, icone, service worker, pacchetti Capacitor
installati e `capacitor.config.ts` già scritto. Scegli una delle tre strade.

---

## Strada 1 — PWA installabile (1 minuto · nessun APK)

1. Dopo `npm run build`, trascina la cartella `dist/` su **https://app.netlify.com/drop**
   (oppure GitHub Pages / Vercel / Cloudflare Pages). Ottieni un URL HTTPS.
2. Sul telefono Android apri l'URL in **Chrome**.
3. Menu `⋮` → **"Installa app"** — o il pulsante **INSTALLA** nell'intestazione dell'app.
4. Icona in home, avvio a schermo intero, funzionamento offline, Web NFC incluso.

---

## Strada 2 — PWABuilder (APK firmato · nessun tool sul PC)

L'app è una PWA completa, quindi **PWABuilder** (servizio Microsoft gratuito) la impacchetta
in un vero APK/AAB nel browser, senza Android Studio né SDK.

1. Pubblica il sito in HTTPS (vedi Strada 1, basta Netlify Drop).
2. Vai su **https://www.pwabuilder.com**, incolla l'URL e premi **Start**.
3. Tab **"Package for Stores"** → **Android** → configura nome/pacchetto
   (es. `com.tagkey.portachiavinfc`) → **Generate**.
4. Scarichi un archivio con:
   - `app-release-signed.apk` → installabile subito sul telefono (firma di test);
   - `app-release.aab` → quello da caricare sul Google Play Store.
5. Sul telefono: copia l'APK, Aprilo e consenti "installazione da fonti sconosciute".

> PWABuilder crea una **Trusted Web Activity**: l'app gira nel motore Chrome del telefono,
> quindi il Web NFC continua a funzionare come nel browser.

---

## Strada 3 — Capacitor (APK nativo · progetto GIÀ CONFIGURATO qui)

I pacchetti `@capacitor/core`, `@capacitor/cli` e `@capacitor/android` sono già installati e
`capacitor.config.ts` è già scritto (appId `com.tagkey.portachiavinfc`, webDir `dist`).
Sul tuo PC, con **Android Studio** installato (SDK 34 + JDK 17), restano solo questi comandi:

```bash
npx cap add android            # crea la cartella android/ col progetto Gradle
npm run build                  # compila la web app in dist/
npx cap sync                   # copia dist/ dentro il progetto Android
npx cap open android           # apre Android Studio
```

In Android Studio: **Build ▸ Build App Bundle(s)/APK(s) ▸ Build APK(s)**.
L'APK arriva in `android/app/build/outputs/apk/debug/app-debug.apk`.

Ad ogni modifica al codice: `npm run build && npx cap sync`, poi di nuovo Build APK.

### Permesso NFC (facoltativo ma consigliato)

In `android/app/src/main/AndroidManifest.xml`, dentro `<manifest>`:

```xml
<uses-permission android:name="android.permission.NFC" />
```

---

## Quale scegliere?

| Voglio… | Strada |
|---|---|
| usarla subito sul telefono | **1 · PWA** |
| un file `.apk` senza installare tool sul PC | **2 · PWABuilder** |
| un progetto Android nativo da compilare/estendere | **3 · Capacitor** |

---

## Nota importante sull'emulazione NFC

Impacchettare l'app come APK **non cambia** i limiti hardware descritti nelle Note tecniche:

- **Lettura NFC** → funziona nell'APK (Web NFC nella WebView Chrome).
- **Emulazione reale (HCE)** → Android espone solo il protocollo ISO-DEP: le classiche
  tessere porta MIFARE non possono essere emulate da un telefono standard, né via web né via APK.
- Se il tuo lettore parla ISO-DEP e vuoi l'emulazione reale, dentro il progetto Capacitor puoi
  aggiungere un servizio Kotlin `HostApduService`: è l'unica strada nativa.

L'emulazione mostrata in questa app è una **simulazione dimostrativa** del flusso
(lettore → telefono → sblocco).

---

## Risoluzione problemi

| Sintomo | Rimedio |
|---|---|
| INSTALLA non compare | Chrome Android + sito HTTPS; oppure menu ⋮ → "Aggiungi a schermata Home" |
| PWABuilder segnala errori nel manifest | Verifica che `/manifest.webmanifest` e `/sw.js` siano raggiungibili sull'URL pubblico |
| Pagina bianca nell'APK Capacitor | `webDir: "dist"` già impostato: rifai `npm run build && npx cap sync` |
| Gradle non sincronizza | Android Studio aggiornato, JDK 17, File ▸ Invalidate Caches |
| Web NFC non legge | NFC attivo nelle impostazioni Android; togli cover spesse; tag vicino alla parte alta del telefono |
| APK non si installa | Sicurezza → consenti "fonti sconosciute" per il file manager usato |
