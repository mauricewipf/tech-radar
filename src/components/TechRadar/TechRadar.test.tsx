import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TechRadar } from './TechRadar'
import type { TechRadarConfig } from './types'

vi.mock('./radarVisualization', () => ({
  radarVisualization: vi.fn(() => () => {}),
}))

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
  entries: [{ label: 'TypeScript', quadrant: 0, ring: 0 }],
}

describe('TechRadar', () => {
  it('renders an accessible radar svg', () => {
    render(<TechRadar config={minimalConfig} />)

    expect(screen.getByRole('group', { name: 'Tech Radar' })).toBeInTheDocument()
  })
})
