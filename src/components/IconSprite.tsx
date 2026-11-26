import sprite from './sprite.svg?raw'
import { useEffect } from 'react'

/** 一次性挂载设计稿里的 SVG symbol 集合（水果插画 + 线性图标） */
export function IconSprite() {
  useEffect(() => {
    if (document.getElementById('store-pos-sprite')) return
    const holder = document.createElement('div')
    holder.id = 'store-pos-sprite'
    holder.setAttribute('aria-hidden', 'true')
    holder.style.position = 'absolute'
    holder.style.width = '0'
    holder.style.height = '0'
    holder.style.overflow = 'hidden'
    holder.innerHTML = sprite
    document.body.insertBefore(holder, document.body.firstChild)
  }, [])

  return null
}
