import { useState, useEffect } from 'react';
import { DiagramCanvas } from './DiagramCanvas';
import { SidebarControls } from './SidebarControls';

export interface CustomLine {
  id: string;
  enabled: boolean;
  anchorX: number;      // pixel X of the fixed anchor point
  anchorY: number;      // pixel Y of the fixed anchor point
  angle: number;        // degrees (0 = right, 90 = up, counter-clockwise)
  length: number;       // pixel length of the line
  color: string;
  lineWidth: number;
  lineDash: boolean;
  showAnchor: boolean;   // whether to draw anchor point indicator
  showEndpoint: boolean; // whether to draw endpoint indicator
  label: string;
}

function createDefaultLine(): CustomLine {
  return {
    id: crypto.randomUUID(),
    enabled: true,
    anchorX: 200,
    anchorY: 300,
    angle: 45,
    length: 150,
    color: '#FF6B00',
    lineWidth: 2,
    lineDash: false,
    showAnchor: true,
    showEndpoint: true,
    label: '',
  };
}

function App() {
  const [kn, setKn] = useState(1.2);
  const [rn, setRn] = useState(0.18);
  const [config, setConfig] = useState<any>(null);
  const [pickingMode, setPickingMode] = useState<'p1' | 'p2' | null>(null);
  const [customLines, setCustomLines] = useState<CustomLine[]>([]);
  const [pickingAnchorId, setPickingAnchorId] = useState<string | null>(null);

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

  // Custom line CRUD
  const addCustomLine = () => {
    setCustomLines(prev => [...prev, createDefaultLine()]);
  };

  const updateCustomLine = (id: string, updates: Partial<CustomLine>) => {
    setCustomLines(prev =>
      prev.map(line => line.id === id ? { ...line, ...updates } : line)
    );
  };

  const removeCustomLine = (id: string) => {
    setCustomLines(prev => prev.filter(line => line.id !== id));
    if (pickingAnchorId === id) setPickingAnchorId(null);
  };

  const handleCanvasClick = (pixelX: number, pixelY: number) => {
    // Custom line anchor picking takes priority when active
    if (pickingAnchorId) {
      updateCustomLine(pickingAnchorId, {
        anchorX: Math.round(pixelX),
        anchorY: Math.round(pixelY),
      });
      setPickingAnchorId(null);
      return;
    }
    // Otherwise delegate to calibration point picking
    handlePointPicked(pixelX, pixelY);
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
        customLines={customLines}
        addCustomLine={addCustomLine}
        updateCustomLine={updateCustomLine}
        removeCustomLine={removeCustomLine}
        pickingAnchorId={pickingAnchorId}
        setPickingAnchorId={setPickingAnchorId}
      />
      <main className="main-content">
        {config ? (
          <DiagramCanvas 
            kn={kn} 
            rn={rn} 
            config={config} 
            pickingMode={pickingMode}
            pickingAnchorId={pickingAnchorId}
            onCanvasClick={handleCanvasClick}
            customLines={customLines}
          />
        ) : (
          <div className="loading-card">Loading Configuration...</div>
        )}
      </main>
    </div>
  );
}

export default App;
