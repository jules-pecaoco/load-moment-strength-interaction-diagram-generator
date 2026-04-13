import React, { useState, useRef } from 'react';
import { ConfigUI } from './ConfigUI';
import { Settings, Save, X, Upload, Loader2, ImagePlus, Database } from 'lucide-react';
import JSZip from 'jszip';
import { drawInteractionDiagram } from './lib/renderDiagram';

interface SidebarControlsProps {
  kn: number;
  rn: number;
  setKn: (val: number) => void;
  setRn: (val: number) => void;
  config: any;
  setConfig: (val: any) => void;
  pickingMode: 'p1' | 'p2' | null;
  setPickingMode: (mode: 'p1' | 'p2' | null) => void;
}

export const SidebarControls: React.FC<SidebarControlsProps> = ({ 
  kn, rn, setKn, setRn, config, setConfig, pickingMode, setPickingMode 
}) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
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

      <hr style={{ borderTop: "1px solid var(--ce-border)", borderBottom: "none", margin: 0 }} />

      {/* EXPORT / ACTIONS */}
      <section className="control-group">
        <button className="primary-button flex-button" onClick={handleSaveImage}>
          <Save size={18} /> Save Current Image
        </button>

        <button className="secondary-button flex-button" onClick={() => setIsConfigOpen(true)}>
          <Settings size={18} /> Settings Configuration
        </button>
      </section>

      <div className="info-card">
        <p>Fine-tune calibration points and visual styles in settings to match your specific chart scale.</p>
      </div>
    </aside>

    {isConfigOpen && (
      <div className="modal-overlay" onClick={() => setIsConfigOpen(false)}>
        <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={e => e.stopPropagation()}>
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
    )}
    </>
  );
};
