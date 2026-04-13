import React from 'react';
import { Trash2, Plus, ChevronDown, MousePointer2, Info } from 'lucide-react';

interface ConfigUIProps {
  config: any;
  setConfig: (val: any) => void;
  pickingMode: 'p1' | 'p2' | null;
  setPickingMode: (mode: 'p1' | 'p2' | null) => void;
}

export const ConfigUI: React.FC<ConfigUIProps> = ({ config, setConfig, pickingMode, setPickingMode }) => {
  if (!config) return null;

  const updateNested = (path: string[], value: any) => {
    const newConfig = JSON.parse(JSON.stringify(config));
    let current = newConfig;
    for (let i = 0; i < path.length - 1; i++) {
       if (!current[path[i]]) current[path[i]] = {};
       current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
    setConfig(newConfig);
  };

  const addConditionalLimit = (lineType: 'horizontal_line' | 'vertical_line') => {
    const newConfig = JSON.parse(JSON.stringify(config));
    if (!newConfig.style) newConfig.style = {};
    if (!newConfig.style[lineType]) newConfig.style[lineType] = {};
    if (!newConfig.style[lineType].conditional_limits) newConfig.style[lineType].conditional_limits = [];
    
    if (lineType === 'horizontal_line') {
      newConfig.style[lineType].conditional_limits.push({ if_kn_above: 0, then_end_rn: 0 });
    } else {
      newConfig.style[lineType].conditional_limits.push({ if_rn_above: 0, then_end_kn: 0 });
    }
    setConfig(newConfig);
  };

  const removeConditionalLimit = (lineType: 'horizontal_line' | 'vertical_line', index: number) => {
    const newConfig = JSON.parse(JSON.stringify(config));
    newConfig.style[lineType].conditional_limits.splice(index, 1);
    setConfig(newConfig);
  };

  const updateConditionalLimit = (lineType: 'horizontal_line' | 'vertical_line', index: number, key: string, value: number) => {
    const newConfig = JSON.parse(JSON.stringify(config));
    newConfig.style[lineType].conditional_limits[index][key] = value;
    setConfig(newConfig);
  };

  return (
    <div className="config-ui">
      
      <details className="config-section" open>
        <summary id="calib-title" className="section-title">
          <div className="summary-content">Calibration Points</div>
          <ChevronDown size={18} className="dropdown-icon" />
        </summary>
        <div className="help-box-main">
          <Info size={14} />
          <p>Calibration tells the tool how to map chart pixels to real numeric values (Rn, Kn).</p>
        </div>

        <div className={`coord-group ${pickingMode === 'p1' ? 'picking-highlight' : ''}`}>
          <div className="coord-group-header">
            <strong>P1 (Axis Origin)</strong>
            <button 
              className={`pick-btn ${pickingMode === 'p1' ? 'active' : ''}`}
              onClick={() => setPickingMode(pickingMode === 'p1' ? null : 'p1')}
              title="Click on the diagram to set this point"
            >
              <MousePointer2 size={14} /> {pickingMode === 'p1' ? 'Picking...' : 'Pick from diagram'}
            </button>
          </div>
          <p className="field-help">Usually the (0,0) point where the X (Rn) and Y (Kn) axes meet.</p>
          <div className="config-row">
            <label>Pixel position X:<input type="number" className="number-input-small" value={config.calibration?.point1?.pixel?.[0] ?? 0} onChange={e => updateNested(['calibration', 'point1', 'pixel', '0'], parseFloat(e.target.value))} /></label>
            <label>Pixel position Y:<input type="number" className="number-input-small" value={config.calibration?.point1?.pixel?.[1] ?? 0} onChange={e => updateNested(['calibration', 'point1', 'pixel', '1'], parseFloat(e.target.value))} /></label>
          </div>
          <div className="config-row">
            <label>Chart Scale Value (Rn):<input type="number" className="number-input-small" value={config.calibration?.point1?.value?.[0] ?? 0} onChange={e => updateNested(['calibration', 'point1', 'value', '0'], parseFloat(e.target.value))} /></label>
            <label>Chart Scale Value (Kn):<input type="number" className="number-input-small" value={config.calibration?.point1?.value?.[1] ?? 0} onChange={e => updateNested(['calibration', 'point1', 'value', '1'], parseFloat(e.target.value))} /></label>
          </div>
        </div>

        <div className={`coord-group ${pickingMode === 'p2' ? 'picking-highlight' : ''}`} style={{ marginTop: '0.75rem' }}>
          <div className="coord-group-header">
            <strong>P2 (Reference Point)</strong>
            <button 
              className={`pick-btn ${pickingMode === 'p2' ? 'active' : ''}`}
              onClick={() => setPickingMode(pickingMode === 'p2' ? null : 'p2')}
              title="Click on the diagram to set this point"
            >
              <MousePointer2 size={14} /> {pickingMode === 'p2' ? 'Picking...' : 'Pick from diagram'}
            </button>
          </div>
          <p className="field-help">A point far from origin (e.g. top-right limit) to set the chart scale accurately.</p>
          <div className="config-row">
            <label>Pixel position X:<input type="number" className="number-input-small" value={config.calibration?.point2?.pixel?.[0] ?? 0} onChange={e => updateNested(['calibration', 'point2', 'pixel', '0'], parseFloat(e.target.value))} /></label>
            <label>Pixel position Y:<input type="number" className="number-input-small" value={config.calibration?.point2?.pixel?.[1] ?? 0} onChange={e => updateNested(['calibration', 'point2', 'pixel', '1'], parseFloat(e.target.value))} /></label>
          </div>
          <div className="config-row">
            <label>Chart Scale Value (Rn):<input type="number" className="number-input-small" value={config.calibration?.point2?.value?.[0] ?? 0} onChange={e => updateNested(['calibration', 'point2', 'value', '0'], parseFloat(e.target.value))} /></label>
            <label>Chart Scale Value (Kn):<input type="number" className="number-input-small" value={config.calibration?.point2?.value?.[1] ?? 0} onChange={e => updateNested(['calibration', 'point2', 'value', '1'], parseFloat(e.target.value))} /></label>
          </div>
        </div>

        <label className="checkbox-label" style={{ marginTop: '0.75rem' }}>
           <input type="checkbox" className="checkbox-input" checked={config.calibration?.show_markers ?? true} onChange={e => updateNested(['calibration', 'show_markers'], e.target.checked)} />
           Show Calibration Markers
        </label>
      </details>

      <details className="config-section">
         <summary id="h-title" className="section-title">
           <div className="summary-content">Horizontal Line Setting</div>
           <ChevronDown size={18} className="dropdown-icon" />
         </summary>
         <p className="help-text">Capacity limit mapping horizontally across the Rn axis.</p>
         <div className="config-row">
            <label>Color: <input type="color" value={config.style?.horizontal_line?.color || '#000000'} onChange={e => updateNested(['style', 'horizontal_line', 'color'], e.target.value)}/></label>
            <label>Width: <input type="number" step="0.1" className="number-input-small" value={config.style?.horizontal_line?.linewidth ?? 1} onChange={e => updateNested(['style', 'horizontal_line', 'linewidth'], parseFloat(e.target.value))}/></label>
            <label>Alpha: <input type="number" step="0.1" min="0" max="1" className="number-input-small" value={config.style?.horizontal_line?.alpha ?? 1} onChange={e => updateNested(['style', 'horizontal_line', 'alpha'], parseFloat(e.target.value))}/></label>
            <label style={{ flex: 1.5 }}>Style: 
              <select className="select-input-small" value={config.style?.horizontal_line?.linestyle || '-'} onChange={e => updateNested(['style', 'horizontal_line', 'linestyle'], e.target.value)}>
                <option value="-">Solid (-)</option>
                <option value="--">Dashed (--)</option>
                <option value="-.">Dash-Dot (-.)</option>
                <option value=":">Dotted (:)</option>
              </select>
            </label>
         </div>
         <div className="conditional-box">
            <strong>Conditional Limits</strong>
            {(config.style?.horizontal_line?.conditional_limits || []).map((limit: any, i: number) => (
              <div key={i} className="limit-row">
                 <label>If Kn &gt; <input type="number" step="0.01" className="number-input-small" value={limit.if_kn_above ?? 0} onChange={e => updateConditionalLimit('horizontal_line', i, 'if_kn_above', parseFloat(e.target.value))}/></label>
                 <label>End Rn: <input type="number" step="0.01" className="number-input-small" value={limit.then_end_rn ?? 0} onChange={e => updateConditionalLimit('horizontal_line', i, 'then_end_rn', parseFloat(e.target.value))}/></label>
                 <button className="del-btn flex-button" aria-label="Delete rule" onClick={() => removeConditionalLimit('horizontal_line', i)}><Trash2 size={12} /></button>
              </div>
            ))}
            <button className="secondary-button flex-button" onClick={() => addConditionalLimit('horizontal_line')}><Plus size={16} /> Add Rule</button>
         </div>
      </details>

      <details className="config-section">
         <summary id="v-title" className="section-title">
           <div className="summary-content">Vertical Line Setting</div>
           <ChevronDown size={18} className="dropdown-icon" />
         </summary>
         <p className="help-text">Limit mapping spanning vertically along the Kn axis.</p>
         <div className="config-row">
            <label>Color: <input type="color" value={config.style?.vertical_line?.color || '#000000'} onChange={e => updateNested(['style', 'vertical_line', 'color'], e.target.value)}/></label>
            <label>Width: <input type="number" step="0.1" className="number-input-small" value={config.style?.vertical_line?.linewidth ?? 1} onChange={e => updateNested(['style', 'vertical_line', 'linewidth'], parseFloat(e.target.value))}/></label>
            <label>Alpha: <input type="number" step="0.1" min="0" max="1" className="number-input-small" value={config.style?.vertical_line?.alpha ?? 1} onChange={e => updateNested(['style', 'vertical_line', 'alpha'], parseFloat(e.target.value))}/></label>
            <label style={{ flex: 1.5 }}>Style: 
              <select className="select-input-small" value={config.style?.vertical_line?.linestyle || '-'} onChange={e => updateNested(['style', 'vertical_line', 'linestyle'], e.target.value)}>
                <option value="-">Solid (-)</option>
                <option value="--">Dashed (--)</option>
                <option value="-.">Dash-Dot (-.)</option>
                <option value=":">Dotted (:)</option>
              </select>
            </label>
         </div>
         <div className="conditional-box">
            <strong>Conditional Limits</strong>
            {(config.style?.vertical_line?.conditional_limits || []).map((limit: any, i: number) => (
              <div key={i} className="limit-row">
                 <label>If Rn &gt; <input type="number" step="0.01" className="number-input-small" value={limit.if_rn_above ?? 0} onChange={e => updateConditionalLimit('vertical_line', i, 'if_rn_above', parseFloat(e.target.value))}/></label>
                 <label>End Kn: <input type="number" step="0.01" className="number-input-small" value={limit.then_end_kn ?? 0} onChange={e => updateConditionalLimit('vertical_line', i, 'then_end_kn', parseFloat(e.target.value))}/></label>
                 <button className="del-btn flex-button" aria-label="Delete rule" onClick={() => removeConditionalLimit('vertical_line', i)}><Trash2 size={12} /></button>
              </div>
            ))}
            <button className="secondary-button flex-button" onClick={() => addConditionalLimit('vertical_line')}><Plus size={16} /> Add Rule</button>
         </div>
      </details>

      <details className="config-section">
         <summary id="r-title" className="section-title">
           <div className="summary-content">Radial Line & Target</div>
           <ChevronDown size={18} className="dropdown-icon" />
         </summary>
         <p className="help-text">Projection vector spanning from origin through the target load.</p>
         <div className="config-row">
            <label>Extend Px: <input type="number" className="number-input-small" value={config.style?.radial_line?.extension ?? 0} onChange={e => updateNested(['style', 'radial_line', 'extension'], parseFloat(e.target.value))}/></label>
            <label>Color: <input type="color" value={config.style?.radial_line?.color || '#000000'} onChange={e => updateNested(['style', 'radial_line', 'color'], e.target.value)}/></label>
            <label>Width: <input type="number" step="0.1" className="number-input-small" value={config.style?.radial_line?.linewidth ?? 1} onChange={e => updateNested(['style', 'radial_line', 'linewidth'], parseFloat(e.target.value))}/></label>
            <label>Alpha: <input type="number" step="0.1" min="0" max="1" className="number-input-small" value={config.style?.radial_line?.alpha ?? 1} onChange={e => updateNested(['style', 'radial_line', 'alpha'], parseFloat(e.target.value))}/></label>
         </div>
      </details>
    </div>
  );
};
