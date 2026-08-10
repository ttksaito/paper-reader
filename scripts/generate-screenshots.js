const sharp = require('sharp');

async function generateScreenshots() {
  try {
    // Wide screenshot (desktop/landscape iPad)
    const wideSvg = `
      <svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#2563eb;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="1280" height="720" fill="url(#grad1)"/>
        <text x="640" y="300" font-family="Arial, sans-serif" font-size="72" fill="white" text-anchor="middle" font-weight="bold">
          Paper Reader
        </text>
        <text x="640" y="380" font-family="Arial, sans-serif" font-size="32" fill="#93c5fd" text-anchor="middle">
          Research Paper PDF Annotation
        </text>
        <text x="640" y="450" font-family="Arial, sans-serif" font-size="24" fill="#dbeafe" text-anchor="middle">
          For iPad with Apple Pencil Support
        </text>
      </svg>
    `;

    await sharp(Buffer.from(wideSvg))
      .png()
      .toFile('./public/screenshot-wide.png');

    console.log('✓ Generated ./public/screenshot-wide.png');

    // Narrow screenshot (portrait phone/iPad)
    const narrowSvg = `
      <svg width="750" height="1334" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#2563eb;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="750" height="1334" fill="url(#grad2)"/>
        <text x="375" y="500" font-family="Arial, sans-serif" font-size="64" fill="white" text-anchor="middle" font-weight="bold">
          Paper Reader
        </text>
        <text x="375" y="600" font-family="Arial, sans-serif" font-size="28" fill="#93c5fd" text-anchor="middle">
          Research Paper
        </text>
        <text x="375" y="650" font-family="Arial, sans-serif" font-size="28" fill="#93c5fd" text-anchor="middle">
          PDF Annotation
        </text>
        <text x="375" y="750" font-family="Arial, sans-serif" font-size="20" fill="#dbeafe" text-anchor="middle">
          For iPad with Apple Pencil Support
        </text>

        <!-- Decorative PDF icon -->
        <g transform="translate(275, 850)">
          <rect x="0" y="0" width="200" height="280" rx="10" fill="white" opacity="0.9"/>
          <path d="M150 0 L200 50 L150 50 Z" fill="#93c5fd" opacity="0.8"/>
          <rect x="30" y="100" width="140" height="10" rx="5" fill="#2563eb" opacity="0.6"/>
          <rect x="30" y="130" width="100" height="10" rx="5" fill="#60a5fa" opacity="0.6"/>
          <rect x="30" y="160" width="120" height="10" rx="5" fill="#60a5fa" opacity="0.6"/>
        </g>
      </svg>
    `;

    await sharp(Buffer.from(narrowSvg))
      .png()
      .toFile('./public/screenshot-narrow.png');

    console.log('✓ Generated ./public/screenshot-narrow.png');

    console.log('\nAll screenshots generated successfully!');
  } catch (error) {
    console.error('Error generating screenshots:', error);
  }
}

generateScreenshots();
