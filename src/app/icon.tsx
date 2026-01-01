import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
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
          position: 'relative',
        }}
      >
        {/* 虫眼鏡の円 */}
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            border: '2.5px solid #1d6bb3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'absolute',
            top: 1,
            left: 1,
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 'bold',
              color: '#1d6bb3',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            助
          </span>
        </div>
        {/* 虫眼鏡の柄 */}
        <div
          style={{
            width: 9,
            height: 3,
            background: '#1d6bb3',
            borderRadius: 2,
            position: 'absolute',
            bottom: 2,
            right: 2,
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

