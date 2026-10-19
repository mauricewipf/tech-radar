import { TechRadar } from './components/TechRadar'
import { sampleRadarConfig } from './data/sampleRadar'
import './App.css'

export default function App() {
  return (
    <main className="app">
      <TechRadar config={sampleRadarConfig} />
    </main>
  )
}
