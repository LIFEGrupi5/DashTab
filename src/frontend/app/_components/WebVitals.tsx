'use client'

import { useEffect } from 'react'
import type { Metric } from 'web-vitals'
import { analytics } from '@/lib/analytics'

function report(metric: Metric) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}: ${Math.round(metric.value)} (${metric.rating})`)
  }
  analytics.webVital(metric.name, Math.round(metric.value), metric.rating)
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
