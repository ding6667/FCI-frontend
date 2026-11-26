import type { CSSProperties } from 'react'

interface IconProps {
  /** sprite 中的 symbol id，如 i-pos / fruit-apple */
  name: string
  className?: string
  style?: CSSProperties
}

/**
 * 图标统一走 sprite 引用：与原设计稿一致，颜色由 currentColor 继承。
 * sprite 在 <IconSprite /> 中一次性注入文档。
 */
export function Icon({ name, className, style }: IconProps) {
  return (
    <svg className={className} style={style} aria-hidden="true">
      <use href={`#${name}`} />
    </svg>
  )
}
