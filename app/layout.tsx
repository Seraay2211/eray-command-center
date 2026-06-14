import type { Metadata, Viewport } from "next";
import { PwaRegistration } from "@/components/pwa/pwa-registration";
import { getAppUrl } from "@/lib/app-url";
import { LIGHT_THEME_IDS } from "@/lib/settings/themes";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getAppUrl()),
  applicationName: "Eray Command Center",
  title: {
    default: "Eray Command Center",
    template: "%s | Eray Command Center",
  },
  description:
    "Kişisel operasyon, not, görev, takvim ve finans kontrol merkezi.",
  manifest: "/manifest.json",
  icons: {
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192" }],
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Eray Command Center",
  },
  formatDetection: {
    address: false,
    email: false,
    telephone: false,
  },
};

export const viewport: Viewport = {
  colorScheme: "dark light",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#09090b",
  viewportFit: "cover",
  width: "device-width",
};

const themeBootstrapScript = `try{const root=document.documentElement;const lightThemes=${JSON.stringify(LIGHT_THEME_IDS)};const saved=JSON.parse(localStorage.getItem("eray-command-center-settings")||"{}");const theme=localStorage.getItem("ecc-theme")||saved.app_theme;const language=localStorage.getItem("ecc-language")||saved.language;if(theme){root.dataset.theme=theme;root.style.colorScheme=lightThemes.includes(theme)?"light":"dark";}root.dataset.font=saved.font_family||"geist";root.dataset.density=saved.density||"compact";root.dataset.sidebar=saved.sidebar_mode||"expanded";root.dataset.reduceMotion=String(saved.reduce_motion===true);if(language){root.lang=language;}}catch{}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      data-density="compact"
      data-font="geist"
      data-reduce-motion="false"
      data-theme="command_dark"
      lang="tr"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: themeBootstrapScript,
          }}
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <PwaRegistration />
        {children}
      </body>
    </html>
  );
}
