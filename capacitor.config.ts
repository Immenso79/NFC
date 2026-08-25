import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Configurazione Capacitor già pronta.
 * Sul tuo PC resta solo:
 *   npx cap add android
 *   npm run build && npx cap sync
 *   npx cap open android   → Build ▸ Build APK(s)
 */
const config: CapacitorConfig = {
  appId: "com.tagkey.portachiavinfc",
  appName: "TAGKEY",
  webDir: "dist",
  backgroundColor: "#0B1220",
  server: {
    androidScheme: "https",
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
