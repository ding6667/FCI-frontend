import { useEffect, useState } from 'react'
import { demoNow } from '@/lib/format'

/** 演示时钟：每秒推进一次，页面刷新时间统一来源于此 */
export function useNow(interval = 1000): Date {
  const [now, setNow] = useState(() => demoNow())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(demoNow()), interval)
    return () => window.clearInterval(timer)
  }, [interval])

  return now
}
