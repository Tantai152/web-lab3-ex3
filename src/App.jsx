import { PubgMatchTelemetry } from './components/PubgMatchTelemetry.jsx';

export default function App() {
  return (
    <main>
      <h1>KRAFTON PUBG VN Live Radar</h1>
      <PubgMatchTelemetry defaultSquadId="te" />
    </main>
  );
}
