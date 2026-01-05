import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = '補助金ナビに招待されました';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* 背景パターン */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            background: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        
        {/* メインコンテンツ */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '40px',
          }}
        >
          {/* ギフトアイコン */}
          <div
            style={{
              fontSize: '80px',
              marginBottom: '20px',
            }}
          >
            🎁
          </div>
          
          {/* タイトル */}
          <div
            style={{
              fontSize: '56px',
              fontWeight: 'bold',
              color: 'white',
              textAlign: 'center',
              marginBottom: '16px',
              textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
            }}
          >
            補助金ナビに招待されました！
          </div>
          
          {/* サブタイトル */}
          <div
            style={{
              fontSize: '28px',
              color: 'rgba(255,255,255,0.9)',
              textAlign: 'center',
              maxWidth: '800px',
              lineHeight: 1.4,
            }}
          >
            全国2,200件以上の補助金データから
            <br />
            あなたの事業に最適な支援制度を見つけましょう
          </div>
          
          {/* CTA風のバッジ */}
          <div
            style={{
              display: 'flex',
              marginTop: '40px',
              padding: '16px 40px',
              background: 'white',
              borderRadius: '50px',
              color: '#1e40af',
              fontSize: '24px',
              fontWeight: 'bold',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            }}
          >
            🔍 無料で補助金を探す →
          </div>
        </div>
        
        {/* フッター */}
        <div
          style={{
            position: 'absolute',
            bottom: '30px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: 'rgba(255,255,255,0.8)',
            fontSize: '20px',
          }}
        >
          <span>💰</span>
          <span>補助金ナビ</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

