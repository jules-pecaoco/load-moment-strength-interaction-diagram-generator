import React from 'react';

interface SidebarControlsProps {
  kn: number;
  rn: number;
  setKn: (val: number) => void;
  setRn: (val: number) => void;
}

export const SidebarControls: React.FC<SidebarControlsProps> = ({ kn, rn, setKn, setRn }) => {
  return (
    <div className="sidebar">
      <h2>Interaction Diagram</h2>
      <p className="subtitle">Real-time mapping & overlay</p>

      <div className="control-group">
        <label>
          K<sub>n</sub> Value: <span className="value-display">{kn.toFixed(3)}</span>
        </label>
        <input 
          type="number" 
          step="0.01" 
          value={kn} 
          onChange={(e) => setKn(parseFloat(e.target.value) || 0)} 
          className="number-input"
        />
        <input 
          type="range" 
          min="-0.5" 
          max="3.0" 
          step="0.01" 
          value={kn} 
          onChange={(e) => setKn(parseFloat(e.target.value))} 
          className="range-slider"
        />
      </div>

      <div className="control-group">
        <label>
          R<sub>n</sub> Value: <span className="value-display">{rn.toFixed(3)}</span>
        </label>
        <input 
          type="number" 
          step="0.01" 
          value={rn} 
          onChange={(e) => setRn(parseFloat(e.target.value) || 0)} 
          className="number-input"
        />
        <input 
          type="range" 
          min="0" 
          max="0.4" 
          step="0.001" 
          value={rn} 
          onChange={(e) => setRn(parseFloat(e.target.value))} 
          className="range-slider"
        />
      </div>
      
      <div className="info-card">
        <h4>Configuration</h4>
        <p>The app parses <code>config.json</code> from the root manually. Modify it to change boundary limits, line colors, and origin calibration.</p>
      </div>
    </div>
  );
};
