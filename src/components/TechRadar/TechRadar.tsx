import { useEffect, useId, useRef } from 'react'
import { radarVisualization } from './radarVisualization'
import type { TechRadarProps } from './types'
import './TechRadar.css'

export function TechRadar({ config, className, svgId }: TechRadarProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const reactId = useId().replace(/:/g, '')
  const resolvedSvgId = svgId ?? `tech-radar-${reactId}`

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) {
      return
    }

    return radarVisualization(svg, config, resolvedSvgId)
  }, [config, resolvedSvgId])

  return (
    <div className={['tech-radar', className].filter(Boolean).join(' ')}>
      <svg ref={svgRef} id={resolvedSvgId} role="img" aria-label={config.title} />
    </div>
  )
}

export type {
  MovedStatus,
  RadarColors,
  RadarEntry,
  RadarOffset,
  RadarQuadrant,
  RadarRing,
  TechRadarConfig,
  TechRadarProps,
} from './types'
