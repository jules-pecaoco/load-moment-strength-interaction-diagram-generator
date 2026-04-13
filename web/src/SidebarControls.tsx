import React, { useState } from 'react';
import { ConfigUI } from './ConfigUI';
import { Settings, Save, X } from 'lucide-react';

interface SidebarControlsProps {
  kn: number;
  rn: number;
  setKn: (val: number) => void;
  setRn: (val: number) => void;
  config: any;
  setConfig: (val: any) => void;
}

export const SidebarControls: React.FC<SidebarControlsProps> = ({ kn, rn, setKn, setRn, config, setConfig }) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const handleSaveImage = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `interaction_diagram_Rn-${rn.toFixed(3)}_Kn-${kn.toFixed(3)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <>
    <aside className="sidebar" aria-label="Controls">
      <header>
        <h2>Interaction Diagram</h2>
        <p className="subtitle">Real-time mapping & overlay</p>
      </header>

      <section className="control-group">
        <label>
          K<sub>n</sub> Value: <span className="value-display">{kn.toFixed(3)}</span>
        </label>
        <input 
          type="number" 
          step="0.01" 
          value={kn} 
          onChange={(e) => setKn(parseFloat(e.target.value) || 0)} 
          className="number-input"
          aria-label="Kn Value"
        />
        <input 
          type="range" 
          min="-0.5" 
          max="3.0" 
          step="0.01" 
          value={kn} 
          onChange={(e) => setKn(parseFloat(e.target.value))} 
          className="range-slider"
          aria-hidden="true"
        />
      </section>

      <section className="control-group">
        <label>
          R<sub>n</sub> Value: <span className="value-display">{rn.toFixed(3)}</span>
        </label>
        <input 
          type="number" 
          step="0.01" 
          value={rn} 
          onChange={(e) => setRn(parseFloat(e.target.value) || 0)} 
          className="number-input"
          aria-label="Rn Value"
        />
        <input 
          type="range" 
          min="0" 
          max="0.4" 
          step="0.001" 
          value={rn} 
          onChange={(e) => setRn(parseFloat(e.target.value))} 
          className="range-slider"
          aria-hidden="true"
        />
      </section>
      
      <button className="primary-button flex-button" onClick={handleSaveImage}>
        <Save size={18} /> Save Image
      </button>

      <button className="secondary-button flex-button" onClick={() => setIsConfigOpen(true)}>
        <Settings size={18} /> Settings Configuration
      </button>

      <div className="info-card">
        <p>Modify settings like limits, origins, and styling via the configuration modal to instantly update the interaction diagram.</p>
      </div>
    </aside>

    {isConfigOpen && (
      <div className="modal-overlay" onClick={() => setIsConfigOpen(false)}>
        <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={e => e.stopPropagation()}>
           <button className="modal-close" aria-label="Close modal" onClick={() => setIsConfigOpen(false)}>
             <X size={24} />
           </button>
           <h2 id="modal-title" style={{ marginBottom: "1.5rem", color: "var(--ce-blue-dark)" }}>Settings Configuration</h2>
           <ConfigUI config={config} setConfig={setConfig} />
        </div>
      </div>
    )}
    </>
  );
};
