import { useEffect, useId, useRef } from 'react'
import { radarVisualization } from './radarVisualization'
import type { TechRadarProps } from './types'
import './TechRadar.css'

export function TechRadar({ config }: TechRadarProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const svgId = `tech-radar-${useId().replace(/:/g, '')}`

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) {
      return
    }

    return radarVisualization(svg, config, svgId)
  }, [config, svgId])

  return (
    <div className="tech-radar">
      <svg ref={svgRef} id={svgId} role="img" aria-label={config.title} />
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
