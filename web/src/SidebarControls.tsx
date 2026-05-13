import React, { useState, useRef } from 'react';
import { ConfigUI } from './ConfigUI';
import { Settings, Save, X, Upload, Loader2, Plus, Trash2, Crosshair, RotateCcw, Eye, EyeOff } from 'lucide-react';
import JSZip from 'jszip';
import { drawInteractionDiagram } from './lib/renderDiagram';
import { drawCustomLines } from './lib/renderCustomLines';
import { calibrate, toPixel } from './lib/math';
import type { CustomLine } from './App';

interface SidebarControlsProps {
  kn: number;
  rn: number;
  setKn: (val: number) => void;
  setRn: (val: number) => void;
  config: any;
  setConfig: (val: any) => void;
  customLines: CustomLine[];
  addCustomLine: () => void;
  updateCustomLine: (id: string, updates: Partial<CustomLine>) => void;
  removeCustomLine: (id: string) => void;
  pickingAnchorId: string | null;
  setPickingAnchorId: (id: string | null) => void;
}

export const SidebarControls: React.FC<SidebarControlsProps> = ({
  kn, rn, setKn, setRn, config, setConfig,
  customLines, addCustomLine, updateCustomLine, removeCustomLine,
  pickingAnchorId, setPickingAnchorId,
}) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedLineId, setExpandedLineId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveImage = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `Rn-${rn.toFixed(3)}_Kn-${kn.toFixed(3)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleBaseImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setConfig({ ...config, image_path: url });
    e.target.value = '';
  };

  const handleBatchCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const text = await file.text();
      const rows = text.split('\n').map(r => r.trim()).filter(r => r !== '');
      
      const parsed = rows.map(r => {
        const parts = r.split(',').map(p => parseFloat(p.trim()));
        if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          return { rn: parts[0], kn: parts[1] };
        }
        return null;
      }).filter(p => p !== null) as {rn: number, kn: number}[];

      if (parsed.length === 0) {
        alert("No valid numeric Rn, Kn data found in CSV. Expected Format: Rn, Kn");
        setIsProcessing(false);
        return;
      }

      // Load background image cleanly
      const img = new Image();
      img.src = config.image_path || '/nominal-load.jpg';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const zip = new JSZip();
      const offscreenCanvas = document.createElement('canvas');
      
      for (const point of parsed) {
        drawInteractionDiagram(offscreenCanvas, img, point.kn, point.rn, config);
        drawCustomLines(offscreenCanvas, customLines);
        const dataUrl = offscreenCanvas.toDataURL('image/png');
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
        
        const fileName = `Rn-${point.rn.toFixed(3)}_Kn-${point.kn.toFixed(3)}.png`;
        zip.file(fileName, base64Data, { base64: true });
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Interaction_Diagrams_Batch.zip`;
      link.click();
    } catch (err) {
      console.error(err);
      alert("An error occurred while generating batch diagrams.");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedLineId(prev => prev === id ? null : id);
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

      <hr style={{ borderTop: "1px solid var(--ce-border)", borderBottom: "none", margin: 0 }} />

      {/* ASSETS & UPLOADS */}
      <section className="control-group">
        <h3 className="section-subtitle"><Database size={16} /> Data & Assets</h3>
        
        <div className="upload-box">
          <input 
            type="file" 
            id="base-image-upload"
            accept="image/*"
            onChange={handleBaseImageUpload}
            style={{ display: 'none' }}
          />
          <label htmlFor="base-image-upload" className="secondary-button flex-button" style={{ cursor: 'pointer' }}>
            <ImagePlus size={18} /> Upload Base Chart
          </label>
          <p className="help-text-sidebar">Use your own interaction diagram image as background.</p>
        </div>

        <div className="upload-box" style={{ marginTop: '0.25rem' }}>
          <input 
            type="file" 
            id="csv-upload"
            accept=".csv"
            onChange={handleBatchCSV}
            ref={fileInputRef}
            style={{ display: 'none' }}
            disabled={isProcessing}
          />
          <label htmlFor="csv-upload" className="secondary-button flex-button" style={{ cursor: isProcessing ? 'not-allowed' : 'pointer', opacity: isProcessing ? 0.7 : 1 }}>
            {isProcessing ? (
              <><Loader2 size={18} className="animate-spin" /> Processing...</>
            ) : (
              <><Upload size={18} /> Batch CSV Export</>
            )}
          </label>
          <p className="help-text-sidebar">Plot multiple Rn, Kn points from a file.</p>
          <a 
            href="data:text/csv;charset=utf-8,rn%2Ckn%0A0.12%2C1.45%0A0.25%2C2.10%0A0.30%2C0.80" 
            download="sample_format.csv" 
            className="sample-link"
          >
            Download Sample CSV
          </a>
        </div>
      </section>

      {/* Custom Lines Section */}
      <section className="control-group custom-lines-section">
        <div className="custom-lines-header">
          <label style={{ flex: 1 }}>CUSTOM LINES</label>
          <button
            className="add-line-btn flex-button"
            onClick={addCustomLine}
            title="Add a new custom line"
          >
            <Plus size={14} /> Add Line
          </button>
        </div>

        {pickingAnchorId && (
          <div className="picking-banner">
            <Crosshair size={14} />
            <span>Click on the diagram to set anchor point</span>
            <button className="cancel-pick-btn" onClick={() => setPickingAnchorId(null)}>
              <X size={14} />
            </button>
          </div>
        )}

        {customLines.length === 0 && (
          <div className="no-lines-hint">
            No custom lines yet. Click <strong>Add Line</strong> to create one.
          </div>
        )}

        {customLines.map((line, index) => (
          <div key={line.id} className={`custom-line-card${expandedLineId === line.id ? ' expanded' : ''}`}>
            <div className="custom-line-card-header" onClick={() => toggleExpand(line.id)}>
              <div className="line-color-indicator" style={{ backgroundColor: line.color }} />
              <span className="line-title">
                {line.label || `Line ${index + 1}`}
              </span>
              <div className="line-card-actions">
                <button
                  className="icon-btn"
                  title={line.enabled ? 'Hide' : 'Show'}
                  onClick={(e) => { e.stopPropagation(); updateCustomLine(line.id, { enabled: !line.enabled }); }}
                >
                  {line.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button
                  className="icon-btn danger"
                  title="Delete line"
                  onClick={(e) => { e.stopPropagation(); removeCustomLine(line.id); }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {expandedLineId === line.id && (
              <div className="custom-line-card-body">
                {/* Label */}
                <div className="cl-field">
                  <label>Label</label>
                  <input
                    type="text"
                    className="number-input-small"
                    placeholder="e.g. My Line"
                    value={line.label}
                    onChange={(e) => updateCustomLine(line.id, { label: e.target.value })}
                  />
                </div>

                {/* Anchor Point */}
                <div className="cl-field-group">
                  <span className="cl-field-group-title">
                    Anchor Point (Fixed)
                    <button
                      className={`pick-anchor-btn${pickingAnchorId === line.id ? ' active' : ''}`}
                      onClick={() => setPickingAnchorId(pickingAnchorId === line.id ? null : line.id)}
                      title="Pick anchor from diagram"
                    >
                      <Crosshair size={12} />
                      {pickingAnchorId === line.id ? ' Picking...' : ' Pick'}
                    </button>
                  </span>
                  <div className="cl-field-row">
                    <div className="cl-field">
                      <label>X (px)</label>
                      <input
                        type="number"
                        className="number-input-small"
                        value={line.anchorX}
                        onChange={(e) => updateCustomLine(line.id, { anchorX: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="cl-field">
                      <label>Y (px)</label>
                      <input
                        type="number"
                        className="number-input-small"
                        value={line.anchorY}
                        onChange={(e) => updateCustomLine(line.id, { anchorY: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </div>

                {/* Angle & Length */}
                <div className="cl-field-group">
                  <span className="cl-field-group-title">Angle & Dimensions</span>
                  <div className="cl-field">
                    <label>Angle: <strong>{line.angle}°</strong></label>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      step="1"
                      value={line.angle}
                      onChange={(e) => updateCustomLine(line.id, { angle: parseFloat(e.target.value) })}
                      className="range-slider"
                    />
                    <input
                      type="number"
                      className="number-input-small"
                      step="1"
                      value={line.angle}
                      onChange={(e) => updateCustomLine(line.id, { angle: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="cl-field">
                    <label>Length (px): <strong>{line.length}</strong></label>
                    <input
                      type="range"
                      min="10"
                      max="800"
                      step="1"
                      value={line.length}
                      onChange={(e) => updateCustomLine(line.id, { length: parseFloat(e.target.value) })}
                      className="range-slider"
                    />
                    <input
                      type="number"
                      className="number-input-small"
                      step="1"
                      value={line.length}
                      onChange={(e) => updateCustomLine(line.id, { length: parseFloat(e.target.value) || 10 })}
                    />
                  </div>
                </div>

                {/* Styling */}
                <div className="cl-field-group">
                  <span className="cl-field-group-title">Styling</span>
                  <div className="cl-field-row">
                    <div className="cl-field">
                      <label>Color</label>
                      <input
                        type="color"
                        value={line.color}
                        onChange={(e) => updateCustomLine(line.id, { color: e.target.value })}
                      />
                    </div>
                    <div className="cl-field">
                      <label>Width</label>
                      <input
                        type="number"
                        className="number-input-small"
                        step="0.5"
                        min="0.5"
                        max="10"
                        value={line.lineWidth}
                        onChange={(e) => updateCustomLine(line.id, { lineWidth: parseFloat(e.target.value) || 1 })}
                      />
                    </div>
                  </div>
                  <div className="cl-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      id={`dash-${line.id}`}
                      checked={line.lineDash}
                      onChange={(e) => updateCustomLine(line.id, { lineDash: e.target.checked })}
                    />
                    <label htmlFor={`dash-${line.id}`} style={{ fontSize: '12px', cursor: 'pointer' }}>Dashed Line</label>
                  </div>
                  <div className="cl-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      id={`anchor-${line.id}`}
                      checked={line.showAnchor}
                      onChange={(e) => updateCustomLine(line.id, { showAnchor: e.target.checked })}
                    />
                    <label htmlFor={`anchor-${line.id}`} style={{ fontSize: '12px', cursor: 'pointer' }}>Show Anchor Point</label>
                  </div>
                  <div className="cl-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      id={`endpoint-${line.id}`}
                      checked={line.showEndpoint}
                      onChange={(e) => updateCustomLine(line.id, { showEndpoint: e.target.checked })}
                    />
                    <label htmlFor={`endpoint-${line.id}`} style={{ fontSize: '12px', cursor: 'pointer' }}>Show Endpoint</label>
                  </div>
                </div>

                {/* Auto-Calibrate Helper */}
                <div className="cl-field-group">
                  <span className="cl-field-group-title">Quick Actions</span>
                  <button
                    className="secondary-button flex-button"
                    style={{ fontSize: '11px', padding: '0.3rem' }}
                    onClick={() => {
                      if (!config?.calibration) return;
                      // Auto-calibrate: set anchor to the current Rn/Kn intersection point
                      const p1 = config.calibration.point1;
                      const p2 = config.calibration.point2;
                      const transform = calibrate(
                        p1.pixel as [number, number],
                        p1.value as [number, number],
                        p2.pixel as [number, number],
                        p2.value as [number, number]
                      );
                      const [px, py] = toPixel(rn, kn, transform);
                      updateCustomLine(line.id, { anchorX: Math.round(px), anchorY: Math.round(py) });
                    }}
                  >
                    <RotateCcw size={12} /> Snap Anchor to Current (Rn, Kn)
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </section>

      <button className="secondary-button flex-button" onClick={() => setIsConfigOpen(true)}>
        <Settings size={18} /> Settings Configuration
      </button>

      <div className="info-card">
        <p>Fine-tune calibration points and visual styles in settings to match your specific chart scale.</p>
      </div>
    </aside>

    {isConfigOpen && (
      <div className="modal-overlay" onClick={() => setIsConfigOpen(false)}>
        <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={e => e.stopPropagation()}>
          <div className="modal-scroll-inner">
           <button className="modal-close" aria-label="Close modal" onClick={() => setIsConfigOpen(false)}>
             <X size={24} />
           </button>
           <h2 id="modal-title" style={{ marginBottom: "1.5rem", color: "var(--ce-blue-dark)" }}>Settings Configuration</h2>
           <ConfigUI 
              config={config} 
              setConfig={setConfig} 
              pickingMode={pickingMode}
              setPickingMode={setPickingMode}
           />
          </div>
        </div>
      </div>
    )}
    </>
  );
};
