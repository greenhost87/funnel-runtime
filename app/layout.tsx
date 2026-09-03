import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./styles/main.scss";

export const metadata: Metadata = {
  title: "Funnel Runtime",
  description: "Configurable multi-step funnel platform",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
