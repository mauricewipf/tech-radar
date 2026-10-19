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
    { name: 'Languages' },
    { name: 'Infrastructure' },
    { name: 'Datastores' },
    { name: 'Data Management' },
    { name: 'Frameworks' },
  ],
  rings: [
    { name: 'ADOPT', color: '#5ba300' },
    { name: 'TRIAL', color: '#009eb0' },
    { name: 'ASSESS', color: '#c7ba00' },
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
