import type { Metadata } from "next";
import type { ReactNode } from "react";
import { themeInitScript } from "@/system/theme/theme";
import "@/app/bootstrap-retention-cron";
import "./styles/main.scss";

export const metadata: Metadata = {
  title: "Funnel Runtime",
  description: "Configurable multi-step funnel platform",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
