# Tech Radar (React)

React + TypeScript port of [Zalando’s Tech Radar](https://opensource.zalando.com/tech-radar/) visualization (D3.js v7).

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
  title: 'My Radar',
  quadrants: [
    { name: 'Languages' },
    { name: 'Infrastructure' },
    { name: 'Datastores' },
    { name: 'Data Management' },
  ],
  rings: [
    { name: 'ADOPT', color: '#5ba300' },
    { name: 'TRIAL', color: '#009eb0' },
    { name: 'ASSESS', color: '#c7ba00' },
    { name: 'HOLD', color: '#e09b96' },
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
| `quadrant` | `0–3`, clockwise from bottom right |
| `ring` | `0–3`, inside → outside |
| `moved` | `-1` down, `0` unchanged, `1` up, `2` new |

Visualization logic is adapted from [zalando/tech-radar](https://github.com/zalando/tech-radar) (MIT).
