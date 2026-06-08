import type { CSSProperties } from 'react'

const CX = 100
const CY = 100
const R = 88
const DR = 3.2
const DY = 11.5
const DX = 11.5

type Pt = { x: number; y: number }

function mkDimples(): Pt[] {
  const pts: Pt[] = []
  let row = 0
  for (let y = CY - R + DY; y < CY + R; y += DY) {
    const hw = Math.sqrt(Math.max(0, R * R - (y - CY) ** 2))
    const xOff = (row % 2) * (DX / 2)
    for (let x = CX - hw + DX + xOff; x < CX + hw - DR; x += DX) {
      pts.push({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 })
    }
    row++
  }
  return pts
}

const DIMPLES = mkDimples()

export function GolfBallSVG({
  size = 320,
  className,
  style,
}: {
  size?: number
  className?: string
  style?: CSSProperties
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
      style={style}
    >
      <defs>
        {/* 3D sphere shading — lit from upper-left */}
        <radialGradient id="ba-sphere" cx="36%" cy="30%" r="68%" fx="36%" fy="30%">
          <stop offset="0%" stopColor="#3a4a5e" />
          <stop offset="42%" stopColor="#1a2638" />
          <stop offset="80%" stopColor="#0c1620" />
          <stop offset="100%" stopColor="#060d18" />
        </radialGradient>

        {/* Rim vignette — darkens the edge to reinforce sphere shape */}
        <radialGradient id="ba-rim" cx="50%" cy="50%" r="50%">
          <stop offset="74%" stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.82)" />
        </radialGradient>

        {/* Subtle edge sheen */}
        <radialGradient id="ba-sheen" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="72%" stopColor="rgba(255,255,255,0)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.028)" />
        </radialGradient>

        {/* Clip dimples to sphere boundary */}
        <clipPath id="ba-clip">
          <circle cx={CX} cy={CY} r={R} />
        </clipPath>

        {/* Soft shadow filter */}
        <filter id="ba-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="10" result="blur" />
        </filter>
      </defs>

      {/* Ground glow — emerald ambient beneath the ball */}
      <ellipse
        cx={CX}
        cy={CY + R + 4}
        rx={R * 0.72}
        ry={16}
        fill="rgba(16, 185, 129, 0.09)"
        filter="url(#ba-glow)"
      />

      {/* Ball sphere body */}
      <circle cx={CX} cy={CY} r={R} fill="url(#ba-sphere)" />

      {/* Dimple depressions — clipped to sphere */}
      <g clipPath="url(#ba-clip)">
        {DIMPLES.map(({ x, y }, i) => (
          <g key={i}>
            {/* Dimple shadow */}
            <circle cx={x} cy={y} r={DR} fill="rgba(0,0,0,0.4)" />
            {/* Dimple rim catchlight */}
            <circle
              cx={x - 0.5}
              cy={y - 0.5}
              r={DR}
              fill="none"
              stroke="rgba(255,255,255,0.07)"
              strokeWidth="0.6"
            />
          </g>
        ))}
      </g>

      {/* Rim vignette overlay */}
      <circle cx={CX} cy={CY} r={R} fill="url(#ba-rim)" />

      {/* Edge sheen */}
      <circle cx={CX} cy={CY} r={R} fill="url(#ba-sheen)" />

      {/* Primary specular highlight */}
      <ellipse
        cx={75}
        cy={70}
        rx={23}
        ry={13}
        transform="rotate(-22 75 70)"
        fill="rgba(255,255,255,0.052)"
      />

      {/* Secondary micro-highlight */}
      <ellipse
        cx={83}
        cy={77}
        rx={7}
        ry={4}
        transform="rotate(-18 83 77)"
        fill="rgba(255,255,255,0.038)"
      />

      {/* Edge ring — very subtle */}
      <circle
        cx={CX}
        cy={CY}
        r={R - 0.5}
        fill="none"
        stroke="rgba(255,255,255,0.038)"
        strokeWidth="1"
      />
    </svg>
  )
}
