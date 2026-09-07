import type { Metadata } from "next";
import Script from "next/script";
import type { ReactNode } from "react";
import { AppFont } from "@/components/layout/app-font";
import { getBasePath } from "@/system/config/base-path";
import { themeInitScript } from "@/system/theme/theme";
import "@/app/bootstrap-retention-cron";
import "./styles/main.scss";

export const metadata: Metadata = {
  title: "Funnel Runtime",
  description: "Configurable multi-step funnel platform",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" data-base-path={getBasePath() || undefined} suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
      </head>
      <body>
        <AppFont>{children}</AppFont>
      </body>
    </html>
  );
}
