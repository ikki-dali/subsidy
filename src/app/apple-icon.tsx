import { ImageResponse } from 'next/og';

export const runtime = 'edge';

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
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'white',
          borderRadius: 36,
          position: 'relative',
        }}
      >
        {/* 虫眼鏡の円 */}
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            border: '12px solid #1d6bb3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'absolute',
            top: 15,
            left: 15,
          }}
        >
          <span
            style={{
              fontSize: 55,
              fontWeight: 'bold',
              color: '#1d6bb3',
              fontFamily: 'sans-serif',
            }}
          >
            助
          </span>
        </div>
        {/* 虫眼鏡の柄 */}
        <div
          style={{
            width: 50,
            height: 18,
            background: '#1d6bb3',
            borderRadius: 9,
            position: 'absolute',
            bottom: 18,
            right: 8,
            transform: 'rotate(45deg)',
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}

