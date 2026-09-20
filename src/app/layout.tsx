import type { Metadata } from "next";
import { Geist, Noto_Sans_KR } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import "./remaster.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const notoSansKr = Noto_Sans_KR({ variable: "--font-noto-sans-kr", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Light Novel Collection",
  description: "읽은 이야기와 생각을 모으는 개인 라이트노벨 아카이브",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" className={`${geist.variable} ${notoSansKr.variable}`}>
      <body>{children}</body>
    </html>
  );
}
