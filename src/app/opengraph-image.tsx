import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        {/* ロゴエリア */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 40,
          }}
        >
          {/* アイコン */}
          <div
            style={{
              width: 100,
              height: 100,
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 24,
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                border: '4px solid white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  fontSize: 32,
                  fontWeight: 'bold',
                  color: 'white',
                }}
              >
                ¥
              </span>
            </div>
          </div>
          {/* サービス名 */}
          <span
            style={{
              fontSize: 72,
              fontWeight: 'bold',
              color: 'white',
            }}
          >
            補助金ナビ
          </span>
        </div>

        {/* キャッチコピー */}
        <div
          style={{
            fontSize: 36,
            color: 'rgba(255, 255, 255, 0.9)',
            textAlign: 'center',
            maxWidth: 800,
            lineHeight: 1.5,
          }}
        >
          あなたの事業に最適な補助金を発見
        </div>

        {/* サブテキスト */}
        <div
          style={{
            fontSize: 24,
            color: 'rgba(255, 255, 255, 0.7)',
            marginTop: 20,
          }}
        >
          全国の補助金・助成金情報を一元検索
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

