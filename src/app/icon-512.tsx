import { ImageResponse } from 'next/og';

export const size = {
  width: 512,
  height: 512,
};
export const contentType = 'image/png';

export default function Icon512() {
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
          borderRadius: 96,
        }}
      >
        {/* コインのサークル */}
        <div
          style={{
            width: 280,
            height: 280,
            borderRadius: 140,
            border: '16px solid white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}
        >
          <span
            style={{
              fontSize: 140,
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
            borderLeft: '48px solid transparent',
            borderRight: '48px solid transparent',
            borderTop: '60px solid white',
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}

