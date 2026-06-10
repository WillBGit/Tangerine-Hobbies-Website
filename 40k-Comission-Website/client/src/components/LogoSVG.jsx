// Places characters individually along a circular arc.
// facing="out" → tops point away from center (top text)
// facing="in"  → tops point toward center (bottom text, reads correctly from outside)
function ArcText({ text, cx, cy, r, startAngle, endAngle, facing, fontSize, letterSpacing }) {
  const chars = text.split('');
  const n = chars.length;
  return chars.map((char, i) => {
    const theta = startAngle + (i / (n - 1)) * (endAngle - startAngle);
    const rad = theta * Math.PI / 180;
    const x = cx + r * Math.cos(rad);
    const y = cy + r * Math.sin(rad);
    const rotation = facing === 'out' ? theta + 90 : theta - 90;
    return (
      <text
        key={i}
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={fontSize}
        letterSpacing={letterSpacing}
        fill="#ff00ff"
        fontFamily="OutrunFuture, serif"
        transform={`rotate(${rotation} ${x} ${y})`}
      >
        {char}
      </text>
    );
  });
}

export default function Logo({ size = 120 }) {
  const cx = 250, cy = 250;

  return (
    <svg width={size} height={size} viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#67e8f9"/>
          <stop offset="50%" stopColor="#a78bfa"/>
          <stop offset="100%" stopColor="#ff6eb4"/>
        </linearGradient>
      </defs>

      {/* Outer black ring */}
      <circle cx={cx} cy={cy} r="245" fill="black"/>

      {/* Inner gradient circle */}
      <circle cx={cx} cy={cy} r="185" fill="url(#logo-grad)"/>

      {/* Pixel-art T — drawn from rectangles to match original */}
      {/* Crossbar */}
      <rect x="148" y="163" width="204" height="33" fill="#ff00ff"/>
      {/* Transition bar just below crossbar */}
      <rect x="183" y="196" width="134" height="8" fill="#ff00ff"/>
      {/* Stem 1 */}
      <rect x="219" y="204" width="62" height="26" fill="#ff00ff"/>
      {/* Wider glitch bar */}
      <rect x="197" y="230" width="106" height="8" fill="#ff00ff"/>
      {/* Stem 2 */}
      <rect x="219" y="238" width="62" height="18" fill="#ff00ff"/>
      {/* Narrow glitch bar */}
      <rect x="224" y="256" width="52" height="6" fill="#ff00ff"/>
      {/* Stem 3 */}
      <rect x="219" y="262" width="62" height="14" fill="#ff00ff"/>
      {/* Gap then stem 4 */}
      <rect x="219" y="281" width="62" height="52" fill="#ff00ff"/>

      {/* Top arc: TANGERINE HOBBIES — 17 chars, 205°→335° (through 270° = top) */}
      <ArcText
        text="TANGERINE HOBBIES"
        cx={cx} cy={cy} r={215}
        startAngle={207} endAngle={333}
        facing="out"
        fontSize={26}
        letterSpacing={0}
      />

      {/* Bottom arc: PRINT! PRINT! PRINT! — 20 chars, 30°→150° (through 90° = bottom) */}
      <ArcText
        text="PRINT! PRINT! PRINT!"
        cx={cx} cy={cy} r={215}
        startAngle={148} endAngle={32}
        facing="in"
        fontSize={20}
        letterSpacing={0}
      />
    </svg>
  );
}
