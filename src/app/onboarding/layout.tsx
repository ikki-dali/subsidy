import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '招待を受けました！ | 補助金ナビ',
  description: 'あなたは補助金ナビに招待されました。登録して、あなたの事業に最適な補助金を見つけましょう。',
  openGraph: {
    title: '🎁 補助金ナビに招待されました！',
    description: '全国2,200件以上の補助金データから、あなたの事業に最適な支援制度を見つけましょう。無料で使えます。',
    type: 'website',
    siteName: '補助金ナビ',
  },
  twitter: {
    card: 'summary_large_image',
    title: '🎁 補助金ナビに招待されました！',
    description: '全国2,200件以上の補助金データから、あなたの事業に最適な支援制度を見つけましょう。',
  },
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

