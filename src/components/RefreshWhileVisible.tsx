'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function RefreshWhileVisible({
  intervalMinutes,
}: {
  intervalMinutes: number
}) {
  const router = useRouter()
  useEffect(() => {
    const interval = intervalMinutes * 60_000
    let lastRefresh = Date.now()
    function refreshIfDue() {
      if (!document.hidden && Date.now() - lastRefresh >= interval) {
        lastRefresh = Date.now()
        router.refresh()
      }
    }
    const timer = window.setInterval(refreshIfDue, interval)
    document.addEventListener('visibilitychange', refreshIfDue)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', refreshIfDue)
    }
  }, [intervalMinutes, router])
  return null
}
