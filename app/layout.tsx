import type { Metadata, Viewport } from "next";
import { PwaRegistration } from "@/components/pwa/pwa-registration";
import { getAppUrl } from "@/lib/app-url";
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

const languageBootstrapScript = `try{const root=document.documentElement;const language=localStorage.getItem("ecc-language");if(language){root.lang=language;}}catch{}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      data-card-style="modern"
      data-density="balanced"
      data-font="geist"
      data-line-height="normal"
      data-color-scheme="dark"
      data-reduce-motion="false"
      data-text-size="normal"
      data-theme="command_dark"
      lang="tr"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: languageBootstrapScript,
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
