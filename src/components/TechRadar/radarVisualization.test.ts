import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { orderRadarEntries, radarVisualization } from './radarVisualization'
import type { RadarEntry, TechRadarConfig } from './types'

const quadrants = [
  { name: 'Languages' },
  { name: 'Infrastructure' },
  { name: 'Datastores' },
  { name: 'Data Management' },
  { name: 'Frameworks' },
] as const

const rings = [
  { name: 'ACT', color: '#5ba300' },
  { name: 'TRIAL', color: '#009eb0' },
  { name: 'ASSESS', color: '#c7ba00' },
] as const

const baseConfig: TechRadarConfig = {
  quadrants: [...quadrants],
  rings: [...rings],
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

function blipByLabel(svg: SVGSVGElement, label: string) {
  return svg.querySelector(`[aria-label^="Trend '${label}'"]`) as SVGGElement | null
}

function shapeOf(blip: Element) {
  return blip.querySelector('a > path, a > circle:not(.blip-focus-ring), path, circle:not(.blip-focus-ring)')
}

describe('orderRadarEntries', () => {
  it('orders by quadrant, then ring, then label, and assigns sequential ids', () => {
    const ordered = orderRadarEntries([
      { label: 'Zig', quadrant: 0, ring: 0 },
      { label: 'Rust', quadrant: 0, ring: 0 },
      { label: 'Kafka', quadrant: 1, ring: 0 },
      { label: 'Redis', quadrant: 0, ring: 1 },
      { label: 'Spark', quadrant: 0, ring: 2 },
    ])

    expect(ordered.map((entry) => entry.label)).toEqual([
      'Rust',
      'Zig',
      'Redis',
      'Spark',
      'Kafka',
    ])
    expect(ordered.map((entry) => entry.id)).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
    ])
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
    vi.restoreAllMocks()
  })

  it('renders ring fills, quadrant labels, and blips into the svg', () => {
    dispose = radarVisualization(svg, baseConfig, 'test-radar')

    expect(svg.id).toBe('test-radar')
    expect(svg.querySelectorAll('circle').length).toBeGreaterThan(0)
    expect(svg.querySelectorAll('.blip')).toHaveLength(3)
    expect(svg.textContent).toContain('Languages')
    expect(svg.textContent).toContain('ACT')
  })

  it('uses the default svg id when none is provided', () => {
    dispose = radarVisualization(svg, baseConfig)

    expect(svg.id).toBe('radar')
    expect(svg.querySelector('#radar-rink')).not.toBeNull()
  })

  it('labels blips for assistive tech', () => {
    dispose = radarVisualization(svg, baseConfig, 'test-radar')

    const typescript = blipByLabel(svg, 'TypeScript')
    expect(typescript).not.toBeNull()
    expect(typescript).toHaveAttribute(
      'aria-label',
      "Trend 'TypeScript' in quadrant 'Languages' and ring 'ACT'",
    )
    expect(typescript).toHaveAttribute('role', 'button')

    const postgres = blipByLabel(svg, 'PostgreSQL')
    expect(postgres).toHaveAttribute('role', 'link')
  })

  it('applies custom colors, scale, font, and legend offsets', () => {
    dispose = radarVisualization(
      svg,
      {
        ...baseConfig,
        scale: 2,
        font_family: 'Courier New',
        colors: {
          background: '#111111',
          grid: '#222222',
          inactive: '#333333',
        },
        legend_offset: [
          { x: -500, y: 0 },
          { x: 500, y: 0 },
          { x: 100, y: 300 },
          { x: 0, y: -500 },
          { x: -100, y: 300 },
        ],
        footer_offset: { x: 10, y: 20 },
        legend_column_width: 200,
        legend_line_height: 14,
      },
      'styled-radar',
    )

    expect(svg.style.backgroundColor).toBe('rgb(17, 17, 17)')
    // getBBox mock is 800×800; fit pads by 16 then multiplies by scale 2.
    expect(svg.getAttribute('width')).toBe('1664')
    expect(svg.getAttribute('height')).toBe('1664')
    expect(svg.textContent).toContain('Languages')
  })

  it('sets a zoomed quadrant viewBox before fitting content', () => {
    dispose = radarVisualization(
      svg,
      { ...baseConfig, zoomed_quadrant: 3 },
      'zoomed-radar',
    )

    // fitSvgToContent overwrites viewBox; zoom path still runs and content fits.
    expect(svg.getAttribute('viewBox')).toMatch(/^-?\d/)
    expect(svg.querySelectorAll('.blip')).toHaveLength(3)
  })

  it('omits print-layout labels when print_layout is false', () => {
    dispose = radarVisualization(
      svg,
      { ...baseConfig, print_layout: false },
      'no-print',
    )

    expect(svg.textContent).not.toContain('ACT')
    expect(svg.textContent).not.toContain('Languages')
    expect(blipByLabel(svg, 'TypeScript')?.querySelector('text')?.textContent).toBe(
      'T',
    )
  })

  it('shows the movement key when show_legend is enabled', () => {
    dispose = radarVisualization(
      svg,
      { ...baseConfig, show_legend: true },
      'legend-radar',
    )

    expect(svg.textContent).toContain('moved up')
    expect(svg.textContent).toContain('moved down')
  })

  it('draws movement glyphs for up, down, new, and unchanged entries', () => {
    dispose = radarVisualization(
      svg,
      {
        ...baseConfig,
        entries: [
          { label: 'Up', quadrant: 0, ring: 0, moved: 1 },
          { label: 'Down', quadrant: 0, ring: 0, moved: -1 },
          { label: 'New', quadrant: 0, ring: 0, moved: 2 },
          { label: 'Same', quadrant: 0, ring: 0, moved: 0 },
        ],
      },
      'moved-radar',
    )

    const up = shapeOf(blipByLabel(svg, 'Up')!)
    const down = shapeOf(blipByLabel(svg, 'Down')!)
    const neu = shapeOf(blipByLabel(svg, 'New')!)
    const same = shapeOf(blipByLabel(svg, 'Same')!)

    expect(up?.tagName.toLowerCase()).toBe('path')
    expect(up).toHaveAttribute('d', 'M -22,10 22,10 0,-26 z')
    expect(down?.tagName.toLowerCase()).toBe('path')
    expect(down).toHaveAttribute('d', 'M -22,-10 22,-10 0,26 z')
    expect(neu?.tagName.toLowerCase()).toBe('path')
    expect(neu?.getAttribute('d')).toBeTruthy()
    expect(same?.tagName.toLowerCase()).toBe('circle')
    expect(same).toHaveAttribute('r', '18')
  })

  it('renders linked blips with and without target=_blank', () => {
    dispose = radarVisualization(
      svg,
      {
        ...baseConfig,
        links_in_new_tabs: true,
        entries: [
          {
            label: 'Docs',
            quadrant: 1,
            ring: 2,
            link: 'https://example.com/docs',
          },
        ],
      },
      'link-radar',
    )

    const link = blipByLabel(svg, 'Docs')?.querySelector('a')
    expect(link).toHaveAttribute('href', 'https://example.com/docs')
    expect(link).toHaveAttribute('target', '_blank')

    dispose()
    dispose = undefined
    svg.replaceChildren()

    dispose = radarVisualization(
      svg,
      {
        ...baseConfig,
        links_in_new_tabs: false,
        entries: [
          {
            label: 'SameTab',
            quadrant: 1,
            ring: 2,
            link: 'https://example.com/same',
          },
        ],
      },
      'same-tab-radar',
    )

    const sameTab = blipByLabel(svg, 'SameTab')?.querySelector('a')
    expect(sameTab).toHaveAttribute('href', 'https://example.com/same')
    expect(sameTab).not.toHaveAttribute('target')
  })

  it('uses inactive styling when inactive and print_layout is false', () => {
    dispose = radarVisualization(
      svg,
      {
        ...baseConfig,
        print_layout: false,
        colors: { inactive: '#abcdef' },
        entries: [
          {
            label: 'Legacy',
            quadrant: 0,
            ring: 0,
            active: false,
          },
        ],
      },
      'inactive-radar',
    )

    const blip = blipByLabel(svg, 'Legacy')!
    const circle = shapeOf(blip)
    expect(circle).toHaveAttribute('fill', '#abcdef')
    expect(blip.querySelector('text')).toBeNull()
  })

  it('uses a smaller font for blip labels longer than two characters', () => {
    const entries: RadarEntry[] = Array.from({ length: 100 }, (_, index) => ({
      label: `Item${index}`,
      quadrant: (index % 5) as 0 | 1 | 2 | 3 | 4,
      ring: (index % 3) as 0 | 1 | 2,
    }))

    dispose = radarVisualization(
      svg,
      { ...baseConfig, entries },
      'long-id-radar',
    )

    const longIdBlip = [...svg.querySelectorAll('.blip')].find(
      (blip) => blip.querySelector('text')?.textContent === '100',
    )
    expect(longIdBlip?.querySelector('text')).toHaveStyle({ fontSize: '16px' })
  })

  it('falls back to an empty blip letter when the label has no alphabetic character', () => {
    dispose = radarVisualization(
      svg,
      {
        ...baseConfig,
        print_layout: false,
        entries: [{ label: '42', quadrant: 0, ring: 0 }],
      },
      'numeric-radar',
    )

    expect(blipByLabel(svg, '42')?.querySelector('text')?.textContent).toBe('')
  })

  it('shows and hides the bubble on pointer and focus interactions', () => {
    dispose = radarVisualization(svg, baseConfig, 'bubble-radar')

    const blip = blipByLabel(svg, 'TypeScript')!
    const bubble = svg.querySelector('#bubble-radar-bubble') as SVGGElement
    const legendItem = document.createElement('span')
    legendItem.id = 'bubble-radar-legendItem1'
    document.body.appendChild(legendItem)

    blip.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
    expect(blip).toHaveClass('blip--focused')
    expect(bubble.style.opacity).toBe('0.8')
    expect(legendItem.getAttribute('filter')).toBe('url(#bubble-radar-solid)')
    expect(legendItem.getAttribute('fill')).toBe('white')

    blip.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }))
    expect(blip).not.toHaveClass('blip--focused')
    expect(bubble.style.opacity).toBe('0')
    expect(legendItem.hasAttribute('filter')).toBe(false)
    expect(legendItem.hasAttribute('fill')).toBe(false)

    blip.dispatchEvent(new FocusEvent('focus', { bubbles: true }))
    expect(blip).toHaveClass('blip--focused')
    expect(bubble.style.opacity).toBe('0.8')

    // Focused blips keep their highlight on mouseout.
    blip.focus()
    blip.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }))
    expect(blip).toHaveClass('blip--focused')

    blip.dispatchEvent(new FocusEvent('blur', { bubbles: true }))
    expect(blip).not.toHaveClass('blip--focused')
    expect(bubble.style.opacity).toBe('0')

    legendItem.remove()
  })

  it('does not show the bubble for inactive blips outside print layout', () => {
    dispose = radarVisualization(
      svg,
      {
        ...baseConfig,
        print_layout: false,
        entries: [{ label: 'Idle', quadrant: 0, ring: 0, active: false }],
      },
      'idle-bubble',
    )

    const blip = blipByLabel(svg, 'Idle')!
    const bubble = svg.querySelector('#idle-bubble-bubble') as SVGGElement

    blip.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
    expect(blip).toHaveClass('blip--focused')
    expect(bubble.style.opacity).toBe('0')
  })

  it('opens linked blips with Enter/Space and ignores other keys', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)

    dispose = radarVisualization(
      svg,
      {
        ...baseConfig,
        links_in_new_tabs: true,
        entries: [
          {
            label: 'Linked',
            quadrant: 0,
            ring: 0,
            link: 'https://example.com/open',
          },
          { label: 'Plain', quadrant: 0, ring: 0 },
        ],
      },
      'keydown-radar',
    )

    const linked = blipByLabel(svg, 'Linked')!
    const plain = blipByLabel(svg, 'Plain')!

    linked.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'a', bubbles: true }),
    )
    expect(open).not.toHaveBeenCalled()

    linked.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    )
    expect(open).toHaveBeenCalledWith(
      'https://example.com/open',
      '_blank',
      'noopener,noreferrer',
    )

    open.mockClear()
    linked.dispatchEvent(
      new KeyboardEvent('keydown', { key: ' ', bubbles: true }),
    )
    expect(open).toHaveBeenCalledTimes(1)

    open.mockClear()
    plain.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    )
    expect(open).not.toHaveBeenCalled()
  })

  it('assigns links in the same tab when links_in_new_tabs is false', () => {
    const assign = vi.fn()
    vi.stubGlobal('location', { assign })

    dispose = radarVisualization(
      svg,
      {
        ...baseConfig,
        links_in_new_tabs: false,
        entries: [
          {
            label: 'Navigate',
            quadrant: 0,
            ring: 0,
            link: 'https://example.com/nav',
          },
        ],
      },
      'assign-radar',
    )

    blipByLabel(svg, 'Navigate')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    )

    expect(assign).toHaveBeenCalledWith('https://example.com/nav')
  })

  it('cleanup stops drawing and clears svg children', () => {
    dispose = radarVisualization(svg, baseConfig, 'test-radar')
    expect(svg.children.length).toBeGreaterThan(0)

    dispose()
    dispose = undefined

    expect(svg.children.length).toBe(0)
  })
})
