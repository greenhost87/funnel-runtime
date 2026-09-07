import { Inter } from "next/font/google";
import type { ReactNode } from "react";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

type AppFontProps = {
  children: ReactNode;
};

export function AppFont({ children }: AppFontProps) {
  return <div className={inter.className}>{children}</div>;
}
