import { cn } from '@/lib/utils'

type Props = {
  src: string
  alt: string
  className?: string
}

export function BrandLogo({ src, alt, className }: Props) {
  return (
    <img
      src={src}
      alt={alt}
      className={cn('w-auto self-start', className)}
      style={{ mixBlendMode: 'multiply' }}
    />
  )
}
