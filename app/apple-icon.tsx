import { ImageResponse } from 'next/og';

// Image metadata
export const size = {
  width: 180,
  height: 180,
};

export const contentType = 'image/png';

// Image generation
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: '#2563eb',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '22.5%', // iOS app icon rounded corners
        }}
      >
        <svg
          width="140"
          height="140"
          viewBox="0 0 512 512"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* PDF Document */}
          <path
            d="M160 96C160 87.1634 167.163 80 176 80H296L384 168V416C384 424.837 376.837 432 368 432H176C167.163 432 160 424.837 160 416V96Z"
            fill="white"
          />
          <path
            d="M296 80L384 168H312C302.059 168 296 161.941 296 152V80Z"
            fill="#93c5fd"
          />
          {/* Pencil */}
          <path d="M308 300L340 268L380 308L348 340L308 300Z" fill="#f59e0b" />
          <path
            d="M300 308L140 468L100 472L104 432L264 272L300 308Z"
            fill="#fbbf24"
          />
          <circle cx="374" cy="274" r="12" fill="#f59e0b" />
          {/* Text Lines */}
          <rect x="200" y="200" width="120" height="8" rx="4" fill="#2563eb" />
          <rect x="200" y="220" width="80" height="8" rx="4" fill="#60a5fa" />
          <rect x="200" y="240" width="100" height="8" rx="4" fill="#60a5fa" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
