import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TechRadar } from './TechRadar'
import type { TechRadarConfig } from './types'

vi.mock('./radarVisualization', () => ({
  radarVisualization: vi.fn(() => () => {}),
}))

const minimalConfig: TechRadarConfig = {
  quadrants: [
    { name: 'Languages', color: '#2E6F40', ringOpacities: [0.72, 0.32, 0.16] },
    { name: 'Infrastructure', color: '#DAA520', ringOpacities: [0.72, 0.32, 0.16] },
    { name: 'Datastores', color: '#DFEFB2', ringOpacities: [0.84, 0.45, 0.32] },
    { name: 'Data Management', color: '#0B70EB', ringOpacities: [0.62, 0.32, 0.16] },
    { name: 'Frameworks', color: '#BBB791', ringOpacities: [0.62, 0.32, 0.16] },
  ],
  rings: [
    { name: 'ACT', color: '#5ba300' },
    { name: 'TRIAL', color: '#009eb0' },
    { name: 'ASSESS', color: '#c7ba00' },
  ],
  entries: [{ label: 'TypeScript', quadrant: 0, ring: 0 }],
}

describe('TechRadar', () => {
  it('renders an accessible radar svg', () => {
    render(<TechRadar config={minimalConfig} />)

    expect(screen.getByRole('group', { name: 'Tech Radar' })).toBeInTheDocument()
  })
})
