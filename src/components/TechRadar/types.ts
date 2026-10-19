export type QuadrantIndex = 0 | 1 | 2 | 3 | 4
export type RingIndex = 0 | 1 | 2

/** -1 moved out, 0 unchanged, 1 moved in, 2 new */
export type MovedStatus = -1 | 0 | 1 | 2

export interface RadarEntry {
  label: string
  /** 0–4 clockwise from +x / bottom-right */
  quadrant: QuadrantIndex
  /** 0–2 from inside to outside */
  ring: RingIndex
  moved?: MovedStatus
  active?: boolean
  link?: string
}

export interface RadarQuadrant {
  name: string
}

export interface RadarRing {
  name: string
  color: string
  description?: string
}

export interface RadarColors {
  background: string
  grid: string
  inactive: string
}

export interface RadarOffset {
  x: number
  y: number
}

export interface TechRadarConfig {
  title: string
  date?: string
  repo_url?: string
  width?: number
  height?: number
  scale?: number
  colors?: Partial<RadarColors>
  font_family?: string
  /** Always five quadrants. */
  quadrants: [
    RadarQuadrant,
    RadarQuadrant,
    RadarQuadrant,
    RadarQuadrant,
    RadarQuadrant,
  ]
  /** Always three rings. */
  rings: [RadarRing, RadarRing, RadarRing]
  entries: RadarEntry[]
  print_layout?: boolean
  links_in_new_tabs?: boolean
  zoomed_quadrant?: QuadrantIndex
  legend_offset?: [
    RadarOffset,
    RadarOffset,
    RadarOffset,
    RadarOffset,
    RadarOffset,
  ]
  title_offset?: RadarOffset
  footer_offset?: RadarOffset
  legend_column_width?: number
  legend_line_height?: number
}

export interface TechRadarProps {
  config: TechRadarConfig
}
