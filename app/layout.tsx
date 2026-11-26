import type { Metadata } from "next";
import "./globals.css";
import PwaRegister from './PwaRegister';

export const metadata: Metadata = {
  title: "Minarah",
  description: "Compagnon quotidien, local et respectueux de la vie privée.",
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <meta name="google" content="notranslate, nopagereadaloud" />
        <link rel="icon" href="/assets/MinarahLogo2.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var raw = localStorage.getItem('minarah-local-v1');
                  var values = raw ? JSON.parse(raw).values || {} : {};
                  var savedTheme = values.theme || localStorage.getItem('theme');
                  var savedMode = values.mode || localStorage.getItem('mode');
                  var theme = savedTheme;
                  if (!theme) {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'pistachio';
                  }
                  document.documentElement.setAttribute('data-theme', theme);
                  if (savedMode) {
                    document.documentElement.setAttribute('data-mode', savedMode);
                  }
                } catch (e) {}
              })()
            `,
          }}
        />
      </head>
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
