import { ImageResponse } from 'next/og';

export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

export default function AppleIcon() {
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
          borderRadius: 36,
        }}
      >
        {/* コインのサークル */}
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            border: '6px solid white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
          }}
        >
          <span
            style={{
              fontSize: 48,
              fontWeight: 'bold',
              color: 'white',
              fontFamily: 'sans-serif',
            }}
          >
            ¥
          </span>
        </div>
        {/* 下向き矢印 */}
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: '16px solid transparent',
            borderRight: '16px solid transparent',
            borderTop: '20px solid white',
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}

