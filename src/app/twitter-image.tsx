import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 1200,
  height: 600,
};
export const contentType = 'image/png';

export default function TwitterImage() {
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
            marginBottom: 32,
          }}
        >
          {/* アイコン */}
          <div
            style={{
              width: 80,
              height: 80,
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 20,
            }}
          >
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                border: '3px solid white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  fontSize: 28,
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
              fontSize: 56,
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
            fontSize: 32,
            color: 'rgba(255, 255, 255, 0.9)',
            textAlign: 'center',
            maxWidth: 700,
            lineHeight: 1.4,
          }}
        >
          あなたの事業に最適な補助金を発見
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

