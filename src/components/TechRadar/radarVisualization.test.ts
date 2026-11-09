import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { orderRadarEntries, radarVisualization } from './radarVisualization'
import type { TechRadarConfig } from './types'

const minimalConfig: TechRadarConfig = {
  quadrants: [
    { name: 'Languages' },
    { name: 'Infrastructure' },
    { name: 'Datastores' },
    { name: 'Data Management' },
    { name: 'Frameworks' },
  ],
  rings: [
    { name: 'ACT', color: '#5ba300' },
    { name: 'TRIAL', color: '#009eb0' },
    { name: 'ASSESS', color: '#c7ba00' },
  ],
  entries: [
    { label: 'TypeScript', quadrant: 0, ring: 0 },
    { label: 'Rust', quadrant: 0, ring: 1, moved: 1 },
    { label: 'PostgreSQL', quadrant: 2, ring: 0, link: 'https://example.com' },
  ],
}

function createSvg() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  document.body.appendChild(svg)
  return svg
}

describe('orderRadarEntries', () => {
  it('orders by quadrant, then ring, then label, and assigns sequential ids', () => {
    const ordered = orderRadarEntries([
      { label: 'Zig', quadrant: 0, ring: 0 },
      { label: 'Rust', quadrant: 0, ring: 0 },
      { label: 'Kafka', quadrant: 1, ring: 0 },
      { label: 'Redis', quadrant: 0, ring: 1 },
    ])

    expect(ordered.map((entry) => entry.label)).toEqual([
      'Rust',
      'Zig',
      'Redis',
      'Kafka',
    ])
    expect(ordered.map((entry) => entry.id)).toEqual(['1', '2', '3', '4'])
  })

  it('returns an empty list for no entries', () => {
    expect(orderRadarEntries([])).toEqual([])
  })
})

describe('radarVisualization', () => {
  let svg: SVGSVGElement
  let dispose: (() => void) | undefined

  beforeEach(() => {
    // jsdom does not implement SVGGeometryElement.getBBox.
    Object.defineProperty(SVGElement.prototype, 'getBBox', {
      configurable: true,
      value: () => ({ x: -400, y: -400, width: 800, height: 800 }),
    })

    svg = createSvg()
  })

  afterEach(() => {
    dispose?.()
    dispose = undefined
    svg.remove()
  })

  it('renders ring fills, quadrant labels, and blips into the svg', () => {
    dispose = radarVisualization(svg, minimalConfig, 'test-radar')

    expect(svg.id).toBe('test-radar')
    expect(svg.querySelectorAll('circle').length).toBeGreaterThan(0)
    expect(svg.querySelectorAll('.blip')).toHaveLength(3)
    expect(svg.textContent).toContain('Languages')
    expect(svg.textContent).toContain('ACT')
  })

  it('labels blips for assistive tech', () => {
    dispose = radarVisualization(svg, minimalConfig, 'test-radar')

    const typescript = svg.querySelector('[aria-label^="Trend \'TypeScript\'"]')
    expect(typescript).not.toBeNull()
    expect(typescript).toHaveAttribute(
      'aria-label',
      'Trend \'TypeScript\' in quadrant \'Languages\' and ring \'ACT\'',
    )
    expect(typescript).toHaveAttribute('role', 'button')

    const postgres = svg.querySelector('[aria-label^="Trend \'PostgreSQL\'"]')
    expect(postgres).toHaveAttribute('role', 'link')
  })

  it('cleanup stops drawing and clears svg children', () => {
    dispose = radarVisualization(svg, minimalConfig, 'test-radar')
    expect(svg.children.length).toBeGreaterThan(0)

    dispose()
    dispose = undefined

    expect(svg.children.length).toBe(0)
  })
})
