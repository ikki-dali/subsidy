import { ImageResponse } from 'next/og';

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
            width: 22,
            height: 22,
            borderRadius: '50%',
            border: '3px solid #1d6bb3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'absolute',
            top: 2,
            left: 2,
          }}
        >
          <span
            style={{
              fontSize: 11,
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
            width: 10,
            height: 4,
            background: '#1d6bb3',
            borderRadius: 2,
            position: 'absolute',
            bottom: 3,
            right: 1,
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

