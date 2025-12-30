import { ImageResponse } from 'next/og';

export const size = {
  width: 192,
  height: 192,
};
export const contentType = 'image/png';

export default function Icon192() {
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
          borderRadius: 38,
        }}
      >
        {/* コインのサークル */}
        <div
          style={{
            width: 110,
            height: 110,
            borderRadius: 55,
            border: '7px solid white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
          }}
        >
          <span
            style={{
              fontSize: 52,
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
            borderLeft: '18px solid transparent',
            borderRight: '18px solid transparent',
            borderTop: '22px solid white',
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}

