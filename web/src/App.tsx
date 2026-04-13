import { useState, useEffect } from 'react';
import { DiagramCanvas } from './DiagramCanvas';
import { SidebarControls } from './SidebarControls';

function App() {
  const [kn, setKn] = useState(1.2);
  const [rn, setRn] = useState(0.18);
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    // Parse config.json manually from the public directory
    fetch('/config.json')
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch config");
        return res.json();
      })
      .then(data => setConfig(data))
      .catch(err => console.error("Could not load config.json:", err));
  }, []);

  return (
    <div className="app-container">
      <SidebarControls kn={kn} rn={rn} setKn={setKn} setRn={setRn} config={config} setConfig={setConfig} />
      <main className="main-content">
        {config ? (
          <DiagramCanvas kn={kn} rn={rn} config={config} />
        ) : (
          <div className="loading-card">Loading Configuration...</div>
        )}
      </main>
    </div>
  );
}

export default App;
