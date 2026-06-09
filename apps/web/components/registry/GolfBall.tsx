type GolfBallSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const SIZE_PX: Record<GolfBallSize, number> = {
  xs: 32,
  sm: 48,
  md: 96,
  lg: 240,
  xl: 400,
}

export function GolfBall({
  size = 'md',
  className = '',
  float = false,
}: {
  size?: GolfBallSize
  className?: string
  float?: boolean
}) {
  const px = SIZE_PX[size]

  return (
    <div
      className={`relative shrink-0 ${float ? 'animate-float-ball' : ''} ${className}`}
      style={{ width: px, height: px }}
      aria-hidden="true"
    >
      {/* Sphere */}
      <div
        className="absolute inset-0 overflow-hidden rounded-full"
        style={{
          background:
            'radial-gradient(circle at 37% 31%, #ffffff 0%, #f5f6f3 26%, #e8ebe6 56%, #d6dbd4 80%, #c5cbc3 100%)',
          boxShadow:
            'inset 0 0 0 1px rgba(24,36,29,0.06), inset -3px -4px 11px rgba(24,36,29,0.07), 0 8px 32px rgba(24,36,29,0.12)',
        }}
      >
        {/* Dimple dot pattern — masked to shadowed hemisphere */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(42,60,50,0.17) 0.85px, transparent 1.7px)',
            backgroundSize: '8.5% 8.5%',
            maskImage:
              'radial-gradient(circle at 40% 36%, #000 0%, rgba(0,0,0,0.9) 56%, rgba(0,0,0,0.4) 80%, transparent 96%)',
            WebkitMaskImage:
              'radial-gradient(circle at 40% 36%, #000 0%, rgba(0,0,0,0.9) 56%, rgba(0,0,0,0.4) 80%, transparent 96%)',
          }}
        />

        {/* Specular highlight — top-left gleam */}
        <div
          className="absolute"
          style={{
            top: '10%',
            left: '18%',
            width: '28%',
            height: '22%',
            background:
              'radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.72) 0%, transparent 70%)',
            transform: 'rotate(-20deg)',
          }}
        />
      </div>
    </div>
  )
}
