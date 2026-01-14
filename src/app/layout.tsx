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
  title: "足立区補助金ナビ - 足立区で使える補助金・助成金を発見",
  description: "足立区の中小企業・個人事業主向け補助金・助成金情報を一元検索。足立区独自の補助金から国・東京都の支援制度まで、あなたに合った支援を見つけましょう。",
  keywords: ["足立区", "補助金", "助成金", "支援金", "中小企業", "事業支援", "申請", "検索", "東京都"],
  authors: [{ name: "足立区補助金ナビ" }],
  creator: "足立区補助金ナビ",
  icons: {
    icon: [
      { url: "/icon.ico", sizes: "32x32" },
      { url: "/icon-32.png", type: "image/png", sizes: "32x32" },
    ],
    shortcut: "/icon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "足立区補助金ナビ - 足立区で使える補助金・助成金を発見",
    description: "足立区の中小企業・個人事業主向け補助金・助成金情報を一元検索。足立区独自の補助金から国・東京都の支援制度まで。",
    type: "website",
    locale: "ja_JP",
    siteName: "足立区補助金ナビ",
  },
  twitter: {
    card: "summary_large_image",
    title: "足立区補助金ナビ - 足立区で使える補助金・助成金を発見",
    description: "足立区の補助金・助成金情報を一元検索",
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
