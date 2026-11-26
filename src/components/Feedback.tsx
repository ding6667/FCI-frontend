import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'

/** 全局轻提示：沿用设计稿底部深绿胶囊样式 */
export function Toast() {
  const toast = useAppStore((s) => s.toast)
  return (
    <div className={`toast ${toast.visible ? 'show' : ''} ${toast.error ? 'error' : ''}`} role="status" aria-live="polite">
      {toast.message}
    </div>
  )
}

/** 数字滚动：工作台 KPI 首次进入时递增到目标值 */
export function CountUp({ value, decimals = 0, duration = 720 }: { value: number; decimals?: number; duration?: number }) {
  const [display, setDisplay] = useState(value)
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    done.current = true
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(value * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])

  return (
    <>
      {display.toLocaleString('zh-CN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
    </>
  )
}
