/**
 * Port of Zalando tech-radar visualization (radar.js), fixed to 5 quadrants / 3 rings.
 * Based on https://github.com/zalando/tech-radar — MIT License
 * Copyright (c) 2017-2025 Zalando SE
 */
import * as d3 from 'd3'
import type { RadarOffset, TechRadarConfig } from './types'

const QUADRANT_COUNT = 5
const RING_COUNT = 3
const OUTER_RADIUS = 400
const DIVIDER_STROKE_WIDTH = 12

interface PolarPoint {
  t: number
  r: number
}

interface CartesianPoint {
  x: number
  y: number
}

interface Segment {
  clipx: (d: RadarBlip) => number
  clipy: (d: RadarBlip) => number
  random: () => CartesianPoint
}

interface RadarBlip {
  label: string
  quadrant: number
  ring: number
  moved: number
  active: boolean
  link?: string
  segment: Segment
  x: number
  y: number
  color: string
  id: string
}

interface Sector {
  start: number
  span: number
}

function normalizeAngle(t: number): number {
  let a = t
  while (a <= -Math.PI) a += 2 * Math.PI
  while (a > Math.PI) a -= 2 * Math.PI
  return a
}

function defaultLegendOffsets(): [
  RadarOffset,
  RadarOffset,
  RadarOffset,
  RadarOffset,
  RadarOffset,
] {
  const span = (2 * Math.PI) / QUADRANT_COUNT
  const legendR = OUTER_RADIUS + 130
  return Array.from({ length: QUADRANT_COUNT }, (_, i) => {
    const mid = span * i + span / 2
    return {
      x: legendR * Math.cos(mid) - 50,
      y: legendR * Math.sin(mid) - 20,
    }
  }) as [
    RadarOffset,
    RadarOffset,
    RadarOffset,
    RadarOffset,
    RadarOffset,
  ]
}

export function radarVisualization(
  svgElement: SVGSVGElement,
  input: TechRadarConfig,
  svgId = 'radar',
): () => void {
  const legend_offset = input.legend_offset ?? defaultLegendOffsets()

  const config = {
    svg_id: svgId,
    scale: input.scale ?? 1,
    colors: {
      background: input.colors?.background ?? 'transparent',
      grid: input.colors?.grid ?? '#dddde0',
      inactive: input.colors?.inactive ?? '#ddd',
    },
    print_layout: input.print_layout ?? true,
    show_legend: input.show_legend ?? false,
    links_in_new_tabs: input.links_in_new_tabs ?? true,
    legend_offset,
    footer_offset: input.footer_offset ?? { x: -155, y: 520 },
    legend_column_width: input.legend_column_width ?? 140,
    legend_line_height: input.legend_line_height ?? 10,
    font_family: input.font_family ?? 'Arial, Helvetica',
    quadrants: input.quadrants,
    rings: input.rings,
    entries: input.entries.map((entry) => ({
      label: entry.label,
      quadrant: entry.quadrant,
      ring: entry.ring,
      moved: entry.moved ?? 0,
      active: entry.active ?? true,
      link: entry.link,
      segment: null as unknown as Segment,
      x: 0,
      y: 0,
      color: '',
      id: '',
    })),
    zoomed_quadrant: input.zoomed_quadrant,
  }

  d3.select(svgElement).selectAll('*').remove()

  let seed = 42
  function random() {
    const x = Math.sin(seed++) * 10000
    return x - Math.floor(x)
  }

  function random_between(min: number, max: number) {
    return min + random() * (max - min)
  }

  function normal_between(min: number, max: number) {
    return min + (random() + random()) * 0.5 * (max - min)
  }

  const sectorSpan = (2 * Math.PI) / QUADRANT_COUNT
  const sectors: Sector[] = Array.from({ length: QUADRANT_COUNT }, (_, i) => ({
    start: sectorSpan * i,
    span: sectorSpan,
  }))

  const rings = [
    { radius: 160 },
    { radius: 280 },
    { radius: OUTER_RADIUS },
  ]

  function polar(cartesian: CartesianPoint): PolarPoint {
    return {
      t: Math.atan2(cartesian.y, cartesian.x),
      r: Math.sqrt(cartesian.x * cartesian.x + cartesian.y * cartesian.y),
    }
  }

  function cartesian(p: PolarPoint): CartesianPoint {
    return {
      x: p.r * Math.cos(p.t),
      y: p.r * Math.sin(p.t),
    }
  }

  function bounded_interval(value: number, min: number, max: number) {
    return Math.min(Math.max(value, Math.min(min, max)), Math.max(min, max))
  }

  function relativeAngle(t: number, start: number) {
    let rel = t - start
    while (rel < 0) rel += 2 * Math.PI
    while (rel >= 2 * Math.PI) rel -= 2 * Math.PI
    return rel
  }

  function clampToSector(point: CartesianPoint, sector: Sector, rMin: number, rMax: number) {
    const p = polar(point)
    const margin = Math.min(0.08, sector.span / 6)
    let rel = relativeAngle(p.t, sector.start)
    rel = bounded_interval(rel, margin, sector.span - margin)
    const r = bounded_interval(p.r, rMin, rMax)
    return cartesian({ t: normalizeAngle(sector.start + rel), r })
  }

  function segment(quadrant: number, ring: number): Segment {
    const sector = sectors[quadrant]
    const rMin = ring === 0 ? 30 : rings[ring - 1].radius
    const rMax = rings[ring].radius
    const pad = 15

    return {
      clipx(d) {
        const clipped = clampToSector(d, sector, rMin + pad, rMax - pad)
        d.x = clipped.x
        d.y = clipped.y
        return d.x
      },
      clipy(d) {
        const clipped = clampToSector(d, sector, rMin + pad, rMax - pad)
        d.x = clipped.x
        d.y = clipped.y
        return d.y
      },
      random() {
        return cartesian({
          t: normalizeAngle(
            sector.start + random_between(0.1, sector.span - 0.1),
          ),
          r: normal_between(rMin + pad, rMax - pad),
        })
      },
    }
  }

  for (const entry of config.entries) {
    entry.segment = segment(entry.quadrant, entry.ring)
    const point = entry.segment.random()
    entry.x = point.x
    entry.y = point.y
    entry.color =
      entry.active || config.print_layout
        ? config.rings[entry.ring].color
        : config.colors.inactive
  }

  const segmented: RadarBlip[][][] = Array.from({ length: QUADRANT_COUNT }, () =>
    Array.from({ length: RING_COUNT }, () => [] as RadarBlip[]),
  )
  for (const entry of config.entries) {
    segmented[entry.quadrant][entry.ring].push(entry)
  }

  let id = 1
  for (let quadrant = 0; quadrant < QUADRANT_COUNT; quadrant++) {
    for (let ring = 0; ring < RING_COUNT; ring++) {
      const entries = segmented[quadrant][ring]
      entries.sort((a, b) => a.label.localeCompare(b.label))
      for (const entry of entries) {
        entry.id = String(id++)
      }
    }
  }

  function translate(x: number, y: number) {
    return `translate(${x},${y})`
  }

  function viewbox(quadrant: number) {
    const sector = sectors[quadrant]
    const mid = sector.start + sector.span / 2
    const cx = Math.cos(mid) * 200
    const cy = Math.sin(mid) * 200
    return [cx - 220, cy - 220, 440, 440].join(' ')
  }

  const solidFilterId = `${config.svg_id}-solid`
  const bubbleId = `${config.svg_id}-bubble`

  const svg = d3
    .select(svgElement)
    .attr('id', config.svg_id)
    .style('background-color', config.colors.background)

  const radar = svg.append('g')
  if (config.zoomed_quadrant !== undefined) {
    svg.attr('viewBox', viewbox(config.zoomed_quadrant))
  }

  function fitSvgToContent() {
    const node = radar.node()
    if (!node) {
      return
    }
    const bbox = node.getBBox()
    const pad = 16
    const x = bbox.x - pad
    const y = bbox.y - pad
    const w = Math.max(bbox.width + pad * 2, 1)
    const h = Math.max(bbox.height + pad * 2, 1)
    svg
      .attr('viewBox', `${x} ${y} ${w} ${h}`)
      .attr('width', w * config.scale)
      .attr('height', h * config.scale)
  }

  const grid = radar.append('g')

  const dividerMaskId = `${config.svg_id}-divider-mask`

  const defs = grid.append('defs')
  const filter = defs
    .append('filter')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', 1)
    .attr('height', 1)
    .attr('id', solidFilterId)
  filter.append('feFlood').attr('flood-color', 'rgb(0, 0, 0, 0.8)')
  filter.append('feComposite').attr('in', 'SourceGraphic')

  // Mask punches divider gaps so the SVG background shows through.
  const dividerMask = defs
    .append('mask')
    .attr('id', dividerMaskId)
    .attr('maskUnits', 'userSpaceOnUse')
    .attr('x', -OUTER_RADIUS)
    .attr('y', -OUTER_RADIUS)
    .attr('width', OUTER_RADIUS * 2)
    .attr('height', OUTER_RADIUS * 2)
  dividerMask
    .append('rect')
    .attr('x', -OUTER_RADIUS)
    .attr('y', -OUTER_RADIUS)
    .attr('width', OUTER_RADIUS * 2)
    .attr('height', OUTER_RADIUS * 2)
    .attr('fill', 'white')
  for (let i = 0; i < rings.length - 1; i++) {
    dividerMask
      .append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', rings[i].radius)
      .attr('fill', 'none')
      .attr('stroke', 'black')
      .attr('stroke-width', DIVIDER_STROKE_WIDTH)
  }
  for (let i = 0; i < QUADRANT_COUNT; i++) {
    const angle = sectors[i].start
    dividerMask
      .append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', OUTER_RADIUS * Math.cos(angle))
      .attr('y2', OUTER_RADIUS * Math.sin(angle))
      .attr('stroke', 'black')
      .attr('stroke-width', DIVIDER_STROKE_WIDTH)
  }

  const ringFills = grid
    .append('g')
    .attr('mask', `url(#${dividerMaskId})`)

  // Fill ring bands outer → inner so each ring keeps its own color.
  for (let i = rings.length - 1; i >= 0; i--) {
    ringFills
      .append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', rings[i].radius)
      .style('fill', config.rings[i].color)
      .style('fill-opacity', 0.28)
      .style('stroke', 'none')
  }

  for (let i = 0; i < rings.length; i++) {
    if (config.print_layout) {
      grid
        .append('text')
        .text(config.rings[i].name)
        .attr('y', -rings[i].radius + 62)
        .attr('text-anchor', 'middle')
        .style('fill', '#000')
        .style('opacity', 0.35)
        .style('font-family', config.font_family)
        .style('font-size', '42px')
        .style('font-weight', 'bold')
        .style('pointer-events', 'none')
        .style('user-select', 'none')
    }
  }

  function legend_transform(
    quadrant: number,
    ring: number,
    legendColumnWidth: number,
    index: number | null = null,
    previousHeight: number | null = null,
  ) {
    const dx = ring < 2 ? 0 : legendColumnWidth
    let dy = index == null ? -16 : index * config.legend_line_height

    if (ring % 2 === 1) {
      dy = dy + 36 + (previousHeight ?? 0)
    }

    return translate(
      config.legend_offset[quadrant].x + dx,
      config.legend_offset[quadrant].y + dy,
    )
  }

  function wrap_text(
    text: d3.Selection<SVGTextElement, RadarBlip, SVGGElement, unknown>,
  ) {
    let heightForNextElement = 0

    text.each(function () {
      const textElement = d3.select(this as SVGTextElement)
      const words = textElement.text().split(' ')
      const line: string[] = []

      const number = `${textElement.text().split('.')[0]}. |`
      const legendNumberText = textElement.append('tspan').text(number)
      const legendBar = textElement.append('tspan').text('|')
      const numberWidth =
        (legendNumberText.node() as SVGTSpanElement).getComputedTextLength() -
        (legendBar.node() as SVGTSpanElement).getComputedTextLength()

      textElement.text(null)

      let tspan = textElement
        .append('tspan')
        .attr('x', 0)
        .attr('y', heightForNextElement)
        .attr('dy', 0)

      for (let position = 0; position < words.length; position++) {
        line.push(words[position])
        tspan.text(line.join(' '))

        if (
          (tspan.node() as SVGTSpanElement).getComputedTextLength() >
            config.legend_column_width &&
          position !== 1
        ) {
          line.pop()
          tspan.text(line.join(' '))
          line.length = 0
          line.push(words[position])

          tspan = textElement
            .append('tspan')
            .attr('x', numberWidth)
            .attr('dy', config.legend_line_height)
            .text(words[position])
        }
      }

      const textBoundingBox = (textElement.node() as SVGTextElement).getBBox()
      heightForNextElement = textBoundingBox.y + textBoundingBox.height
    })
  }

  if (config.print_layout) {
    if (config.show_legend) {
      radar
        .append('text')
        .attr(
          'transform',
          translate(config.footer_offset.x, config.footer_offset.y),
        )
        .text('▲ moved up     ▼ moved down     ★ new     ⬤ no change')
        .attr('xml:space', 'preserve')
        .style('font-family', config.font_family)
        .style('font-size', '12px')
    }

    const legend = radar.append('g')
    for (let quadrant = 0; quadrant < QUADRANT_COUNT; quadrant++) {
      legend
        .append('text')
        .attr(
          'transform',
          translate(
            config.legend_offset[quadrant].x,
            config.legend_offset[quadrant].y - 45,
          ),
        )
        .text(config.quadrants[quadrant].name)
        .style('font-family', config.font_family)
        .style('font-size', '18px')
        .style('font-weight', 'bold')

      let previousLegendHeight = 0
      for (let ring = 0; ring < RING_COUNT; ring++) {
        if (ring % 2 === 0) {
          previousLegendHeight = 0
        }
        legend
          .append('text')
          .attr(
            'transform',
            legend_transform(
              quadrant,
              ring,
              config.legend_column_width,
              null,
              previousLegendHeight,
            ),
          )
          .text(config.rings[ring].name)
          .style('font-family', config.font_family)
          .style('font-size', '12px')
          .style('font-weight', 'bold')
          .style('fill', config.rings[ring].color)

        legend
          .selectAll(`.legend${quadrant}${ring}`)
          .data(segmented[quadrant][ring])
          .enter()
          .append('a')
          .attr('href', (d) => (d.link ? d.link : '#'))
          .attr('target', (d) =>
            d.link && config.links_in_new_tabs ? '_blank' : null,
          )
          .append('text')
          .attr('transform', (_d, i) =>
            legend_transform(
              quadrant,
              ring,
              config.legend_column_width,
              i,
              previousLegendHeight,
            ),
          )
          .attr('class', `legend${quadrant}${ring}`)
          .attr('id', (d) => `${config.svg_id}-legendItem${d.id}`)
          .text((d) => `${d.id}. ${d.label}`)
          .style('font-family', config.font_family)
          .style('font-size', '11px')
          .on('mouseover', (_event, d) => {
            showBubble(d)
            highlightLegendItem(d)
          })
          .on('mouseout', (_event, d) => {
            hideBubble()
            unhighlightLegendItem(d)
          })
          .call(wrap_text)
          .each(function () {
            previousLegendHeight += (d3.select(this).node() as SVGTextElement)
              .getBBox().height
          })
      }
    }
  }

  const rink = radar.append('g').attr('id', `${config.svg_id}-rink`)

  const bubble = radar
    .append('g')
    .attr('id', bubbleId)
    .attr('x', 0)
    .attr('y', 0)
    .style('opacity', 0)
    .style('pointer-events', 'none')
    .style('user-select', 'none')
  bubble.append('rect').attr('rx', 4).attr('ry', 4).style('fill', '#333')
  bubble
    .append('text')
    .style('font-family', config.font_family)
    .style('font-size', '10px')
    .style('fill', '#fff')
  bubble.append('path').attr('d', 'M 0,0 10,0 5,8 z').style('fill', '#333')

  function showBubble(d: RadarBlip) {
    if (d.active || config.print_layout) {
      const tooltip = d3.select(`#${bubbleId} text`).text(d.label)
      const bbox = (tooltip.node() as SVGTextElement).getBBox()
      d3.select(`#${bubbleId}`)
        .attr('transform', translate(d.x - bbox.width / 2, d.y - 16))
        .style('opacity', 0.8)
      d3.select(`#${bubbleId} rect`)
        .attr('x', -5)
        .attr('y', -bbox.height)
        .attr('width', bbox.width + 10)
        .attr('height', bbox.height + 4)
      d3.select(`#${bubbleId} path`).attr(
        'transform',
        translate(bbox.width / 2 - 5, 3),
      )
    }
  }

  function hideBubble() {
    d3.select(`#${bubbleId}`)
      .attr('transform', translate(0, 0))
      .style('opacity', 0)
  }

  function highlightLegendItem(d: RadarBlip) {
    const legendItem = document.getElementById(
      `${config.svg_id}-legendItem${d.id}`,
    )
    legendItem?.setAttribute('filter', `url(#${solidFilterId})`)
    legendItem?.setAttribute('fill', 'white')
  }

  function unhighlightLegendItem(d: RadarBlip) {
    const legendItem = document.getElementById(
      `${config.svg_id}-legendItem${d.id}`,
    )
    legendItem?.removeAttribute('filter')
    legendItem?.removeAttribute('fill')
  }

  const blips = rink
    .selectAll('.blip')
    .data(config.entries)
    .enter()
    .append('g')
    .attr('class', 'blip')
    .attr('transform', (d, i) =>
      legend_transform(d.quadrant, d.ring, config.legend_column_width, i),
    )
    .on('mouseover', (_event, d) => {
      showBubble(d)
      highlightLegendItem(d)
    })
    .on('mouseout', (_event, d) => {
      hideBubble()
      unhighlightLegendItem(d)
    })

  blips.each(function (d) {
    const root = d3.select(this)
    const blip =
      d.active && d.link
        ? (() => {
            const link = root.append('a').attr('xlink:href', d.link)
            if (config.links_in_new_tabs) {
              link.attr('target', '_blank')
            }
            return link
          })()
        : root

    const blipFill =
      d.active || config.print_layout ? '#000' : config.colors.inactive

    if (d.moved === 1) {
      blip
        .append('path')
        .attr('d', 'M -11,5 11,5 0,-13 z')
        .style('fill', blipFill)
    } else if (d.moved === -1) {
      blip
        .append('path')
        .attr('d', 'M -11,-5 11,-5 0,13 z')
        .style('fill', blipFill)
    } else if (d.moved === 2) {
      blip
        .append('path')
        .attr('d', d3.symbol().type(d3.symbolStar).size(200)())
        .style('fill', blipFill)
    } else {
      blip.append('circle').attr('r', 9).attr('fill', blipFill)
    }

    if (d.active || config.print_layout) {
      const blip_text = config.print_layout
        ? d.id
        : (d.label.match(/[a-z]/i)?.[0] ?? '')
      blip
        .append('text')
        .text(blip_text)
        .attr('y', 3)
        .attr('text-anchor', 'middle')
        .style('fill', '#fff')
        .style('font-family', config.font_family)
        .style('font-size', blip_text.length > 2 ? '8px' : '9px')
        .style('pointer-events', 'none')
        .style('user-select', 'none')
    }
  })

  function ticked() {
    blips.attr('transform', (d) =>
      translate(d.segment.clipx(d), d.segment.clipy(d)),
    )
  }

  const simulation = d3
    .forceSimulation(config.entries)
    .velocityDecay(0.19)
    .force('collision', d3.forceCollide().radius(12).strength(0.85))
    .on('tick', ticked)

  // Fit after the first layout ticks so blips sit in their segments.
  simulation.tick(50)
  ticked()
  fitSvgToContent()

  return () => {
    simulation.stop()
    d3.select(svgElement).selectAll('*').remove()
  }
}
