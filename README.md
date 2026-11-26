# Tech Radar (React)

React + TypeScript port of [Zalando’s Tech Radar](https://opensource.zalando.com/tech-radar/) visualization (D3.js v7), fixed to **5 quadrants** and **3 rings**.

## Run

```bash
npm install
npm run dev
```

## Use the component

```tsx
import { TechRadar } from './components/TechRadar'
import type { TechRadarConfig } from './components/TechRadar'

const config: TechRadarConfig = {
  quadrants: [
    { name: 'Languages', color: '#2E6F40', ringOpacities: [0.72, 0.32, 0.16] },
    { name: 'Infrastructure', color: '#DAA520', ringOpacities: [0.72, 0.32, 0.16] },
    { name: 'Datastores', color: '#DFEFB2', ringOpacities: [0.84, 0.45, 0.32] },
    { name: 'Data Management', color: '#0B70EB', ringOpacities: [0.62, 0.32, 0.16] },
    { name: 'Frameworks', color: '#BBB791', ringOpacities: [0.62, 0.32, 0.16] },
  ],
  rings: [
    { name: 'ADOPT' },
    { name: 'TRIAL' },
    { name: 'ASSESS' },
  ],
  entries: [
    { label: 'TypeScript', quadrant: 0, ring: 0, moved: 0 },
  ],
}

export function Page() {
  return <TechRadar config={config} />
}
```

### Entry fields

| Field | Meaning |
| --- | --- |
| `quadrant` | `0–4`, clockwise from +x (always 5 quadrants) |
| `ring` | `0–2`, inside → outside (always 3 rings) |
| `moved` | `-1` down, `0` unchanged, `1` up, `2` new |

The SVG always auto-sizes to the radar content.

Visualization logic is adapted from [zalando/tech-radar](https://github.com/zalando/tech-radar) (MIT).
