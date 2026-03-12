import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
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
          borderRadius: 38,
          background: 'linear-gradient(135deg, #F88379 0%, #E5685E 100%)',
        }}
      >
        <span
          style={{
            fontSize: 120,
            fontWeight: 900,
            color: 'white',
            lineHeight: 1,
            letterSpacing: -4,
          }}
        >
          W
        </span>
      </div>
    ),
    { ...size }
  );
}
