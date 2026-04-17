'use client'

import { useEffect } from 'react'
import type { Metric } from 'web-vitals'

function report(metric: Metric) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}: ${Math.round(metric.value)}`)
  }
  // TODO: replace with real endpoint — fetch('/api/vitals', { method: 'POST', body: JSON.stringify(metric) })
}

export default function WebVitals() {
  useEffect(() => {
    import('web-vitals').then(({ onCLS, onFCP, onINP, onLCP, onTTFB }) => {
      onCLS(report)
      onFCP(report)
      onINP(report)
      onLCP(report)
      onTTFB(report)
    })
  }, [])
  return null
}
