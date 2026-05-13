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
    if (pickingAnchorId) {
      updateCustomLine(pickingAnchorId, {
        anchorX: Math.round(pixelX),
        anchorY: Math.round(pixelY),
      });
      setPickingAnchorId(null);
    }
  };

  return (
    <div className="app-container">
      <SidebarControls
        kn={kn} rn={rn} setKn={setKn} setRn={setRn}
        config={config} setConfig={setConfig}
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
            kn={kn} rn={rn} config={config}
            customLines={customLines}
            pickingAnchorId={pickingAnchorId}
            onCanvasClick={handleCanvasClick}
          />
        ) : (
          <div className="loading-card">Loading Configuration...</div>
        )}
      </main>
    </div>
  );
}

export default App;
