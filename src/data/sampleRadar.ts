import type { TechRadarConfig } from '../components/TechRadar'

export const sampleRadarConfig: TechRadarConfig = {
  title: 'Tech Radar',
  date: '2026.10',
  repo_url: 'https://github.com/zalando/tech-radar',
  colors: {
    background: 'transparent',
    grid: '#dddde0',
    inactive: '#ddd',
  },
  font_family: 'Arial, Helvetica',
  print_layout: true,
  links_in_new_tabs: true,
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
    { label: 'Python', quadrant: 0, ring: 0, moved: 0 },
    { label: 'Go', quadrant: 0, ring: 0, moved: 1 },
    { label: 'Rust', quadrant: 0, ring: 2, moved: 2 },
    { label: 'Kotlin', quadrant: 0, ring: 0, moved: 0 },
    { label: 'Scala', quadrant: 0, ring: 1, moved: 0 },

    { label: 'Kubernetes', quadrant: 1, ring: 0, moved: 0 },
    { label: 'Docker', quadrant: 1, ring: 0, moved: 0 },
    { label: 'AWS EKS', quadrant: 1, ring: 0, moved: 1 },
    { label: 'OpenTelemetry', quadrant: 1, ring: 0, moved: 0 },
    { label: 'AWS Lambda', quadrant: 1, ring: 1, moved: 0 },
    { label: 'WebAssembly', quadrant: 1, ring: 1, moved: 2 },

    { label: 'PostgreSQL', quadrant: 2, ring: 0, moved: 0 },
    { label: 'Redis', quadrant: 2, ring: 0, moved: 0 },
    { label: 'Elasticsearch', quadrant: 2, ring: 0, moved: 0 },
    { label: 'DynamoDB', quadrant: 2, ring: 0, moved: 0 },
    { label: 'ClickHouse', quadrant: 2, ring: 1, moved: 2 },
    { label: 'MongoDB', quadrant: 2, ring: 2, moved: -1 },

    { label: 'Kafka', quadrant: 3, ring: 0, moved: 0 },
    { label: 'Spark', quadrant: 3, ring: 0, moved: 0 },
    { label: 'Apache Airflow', quadrant: 3, ring: 0, moved: 0 },
    { label: 'dbt', quadrant: 3, ring: 1, moved: 0 },
    { label: 'Flink', quadrant: 3, ring: 0, moved: 1 },
    { label: 'Streamlit', quadrant: 3, ring: 2, moved: 0 },

    { label: 'React', quadrant: 4, ring: 0, moved: 0 },
    { label: 'Next.js', quadrant: 4, ring: 0, moved: 1 },
    { label: 'Vue', quadrant: 4, ring: 1, moved: 0 },
    { label: 'Svelte', quadrant: 4, ring: 2, moved: 2 },
    { label: 'Angular', quadrant: 4, ring: 2, moved: -1 },
    { label: 'Remix', quadrant: 4, ring: 1, moved: 0 },
  ],
}
