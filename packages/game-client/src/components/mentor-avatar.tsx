/**
 * CyberMentor — pixel-art character avatar (SVG, 64 × 64 grid units)
 * Color tokens from the game design system:
 *   Skin  : #f5c89a
 *   Hair  : #1a1a2e  (dark navy)
 *   Hoodie: #0d1b2a  (deep navy)
 *   Accent: #00ff88  (neon green  – primary)
 *   Cyan  : #00e5ff  (cyan        – secondary)
 *   Visor : #00e5ff  (cyan glass)
 *   Screen: #0d1b2a  (laptop dark)
 */

export function MentorAvatar({ size = 64 }: { size?: number }) {
  const u = size / 16   // 1 pixel unit = size/16

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      style={{ imageRendering: 'pixelated' }}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Cyber Mentor character"
      role="img"
    >
      {/* ── Hair / hood top ── */}
      <rect x="4" y="0" width="8" height="1" fill="#1a1a2e" />
      <rect x="3" y="1" width="10" height="1" fill="#1a1a2e" />

      {/* ── Head ── */}
      <rect x="3" y="2" width="10" height="5" fill="#f5c89a" />

      {/* Cyber visor / glasses */}
      <rect x="4" y="4" width="3" height="2" fill="#00e5ff" opacity="0.85" />
      <rect x="9" y="4" width="3" height="2" fill="#00e5ff" opacity="0.85" />
      <rect x="7" y="4" width="2" height="1" fill="#1a1a2e" />   {/* bridge */}

      {/* Visor neon outline */}
      <rect x="4"  y="3" width="3" height="1" fill="#00e5ff" opacity="0.4" />
      <rect x="9"  y="3" width="3" height="1" fill="#00e5ff" opacity="0.4" />

      {/* Mouth */}
      <rect x="6" y="6" width="4" height="1" fill="#c8956a" />

      {/* ── Hood sides ── */}
      <rect x="2" y="2" width="1" height="5" fill="#1a1a2e" />
      <rect x="13" y="2" width="1" height="5" fill="#1a1a2e" />

      {/* ── Neck ── */}
      <rect x="6" y="7" width="4" height="1" fill="#f5c89a" />

      {/* ── Hoodie body ── */}
      <rect x="2" y="8"  width="12" height="5" fill="#0d2137" />

      {/* Hoodie neon trim */}
      <rect x="2" y="8"  width="12" height="1" fill="#00ff88" opacity="0.6" />
      <rect x="2" y="12" width="12" height="1" fill="#00ff88" opacity="0.4" />

      {/* CQ logo on chest */}
      <rect x="6" y="9" width="4" height="3" fill="#0d1b2a" />
      <rect x="7" y="9" width="2" height="1" fill="#00ff88" />   {/* C top */}
      <rect x="6" y="10" width="1" height="1" fill="#00ff88" />  {/* C left */}
      <rect x="6" y="11" width="2" height="1" fill="#00ff88" />  {/* C bot */}
      <rect x="9" y="9"  width="1" height="3" fill="#00e5ff" />  {/* Q stem */}
      <rect x="9" y="11" width="1" height="1" fill="#00e5ff" />

      {/* ── Arms ── */}
      <rect x="0" y="8"  width="2" height="4" fill="#0d2137" />
      <rect x="14" y="8" width="2" height="4" fill="#0d2137" />

      {/* Hands */}
      <rect x="0" y="12" width="2" height="1" fill="#f5c89a" />
      <rect x="14" y="12" width="2" height="1" fill="#f5c89a" />

      {/* ── Laptop / device in hands ── */}
      <rect x="1"  y="13" width="14" height="3" fill="#101c2c" />
      <rect x="2"  y="13" width="12" height="2" fill="#0d2137" />
      {/* Screen glow lines */}
      <rect x="3"  y="13" width="5"  height="1" fill="#00ff88" opacity="0.5" />
      <rect x="9"  y="13" width="3"  height="1" fill="#00e5ff" opacity="0.5" />
      <rect x="3"  y="14" width="7"  height="1" fill="#00ff88" opacity="0.25" />
      {/* Keyboard row */}
      <rect x="2"  y="15" width="12" height="1" fill="#0a1628" />
      <rect x="3"  y="15" width="1"  height="1" fill="#1e3a5f" />
      <rect x="5"  y="15" width="1"  height="1" fill="#1e3a5f" />
      <rect x="7"  y="15" width="2"  height="1" fill="#1e3a5f" />
      <rect x="10" y="15" width="1"  height="1" fill="#1e3a5f" />
      <rect x="12" y="15" width="1"  height="1" fill="#1e3a5f" />
    </svg>
  )
}
