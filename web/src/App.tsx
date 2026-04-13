import { useState, useEffect } from 'react';
import { DiagramCanvas } from './DiagramCanvas';
import { SidebarControls } from './SidebarControls';

function App() {
  const [kn, setKn] = useState(1.2);
  const [rn, setRn] = useState(0.18);
  const [config, setConfig] = useState<any>(null);
  const [pickingMode, setPickingMode] = useState<'p1' | 'p2' | null>(null);

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

  const handlePointPicked = (x: number, y: number) => {
    if (!pickingMode || !config) return;

    const newConfig = JSON.parse(JSON.stringify(config));
    const pointKey = pickingMode === 'p1' ? 'point1' : 'point2';
    
    if (!newConfig.calibration) newConfig.calibration = {};
    if (!newConfig.calibration[pointKey]) newConfig.calibration[pointKey] = {};
    if (!newConfig.calibration[pointKey].pixel) newConfig.calibration[pointKey].pixel = [0, 0];
    
    newConfig.calibration[pointKey].pixel[0] = Math.round(x);
    newConfig.calibration[pointKey].pixel[1] = Math.round(y);
    
    setConfig(newConfig);
    setPickingMode(null); // Exit picking mode after selection
  };

  return (
    <div className="app-container">
      <SidebarControls 
        kn={kn} 
        rn={rn} 
        setKn={setKn} 
        setRn={setRn} 
        config={config} 
        setConfig={setConfig}
        pickingMode={pickingMode}
        setPickingMode={setPickingMode}
      />
      <main className="main-content">
        {config ? (
          <DiagramCanvas 
            kn={kn} 
            rn={rn} 
            config={config} 
            pickingMode={pickingMode}
            onPointPicked={handlePointPicked}
          />
        ) : (
          <div className="loading-card">Loading Configuration...</div>
        )}
      </main>
    </div>
  );
}

export default App;
