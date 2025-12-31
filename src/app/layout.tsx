import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Toaster } from "@/components/ui/sonner";
import { DeadlineReminder } from "@/components/features/deadline-reminder";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000"
  ),
  title: "補助金ナビ - あなたに最適な補助金を発見",
  description: "全国の補助金・助成金情報を一元検索。地域・業種・金額から、あなたに合った支援制度を見つけましょう。",
  keywords: ["補助金", "助成金", "支援金", "中小企業", "事業支援", "申請", "検索"],
  authors: [{ name: "補助金ナビ" }],
  creator: "補助金ナビ",
  icons: {
    icon: [
      { url: "/icon.ico", sizes: "32x32" },
      { url: "/icon-32.png", type: "image/png", sizes: "32x32" },
    ],
    shortcut: "/icon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "補助金ナビ - あなたに最適な補助金を発見",
    description: "全国の補助金・助成金情報を一元検索。地域・業種・金額から、あなたに合った支援制度を見つけましょう。",
    type: "website",
    locale: "ja_JP",
    siteName: "補助金ナビ",
  },
  twitter: {
    card: "summary_large_image",
    title: "補助金ナビ - あなたに最適な補助金を発見",
    description: "全国の補助金・助成金情報を一元検索",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="pb-16 md:pb-0">
          {children}
        </div>
        <BottomNav />
        <Toaster position="top-right" richColors closeButton />
        <DeadlineReminder />
      </body>
    </html>
  );
}
