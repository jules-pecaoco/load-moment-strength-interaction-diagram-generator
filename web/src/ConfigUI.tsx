import React from 'react';
import { Trash2, Plus } from 'lucide-react';

interface ConfigUIProps {
  config: any;
  setConfig: (val: any) => void;
}

export const ConfigUI: React.FC<ConfigUIProps> = ({ config, setConfig }) => {
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
        <summary id="calib-title" className="section-title">Calibration Points</summary>
        <p className="help-text">Map strict vector limits (Val Rn / Val Kn) to their corresponding exact pixel coordinates on the base image.</p>
        <div className="coord-group">
          <strong>P1 (Origin)</strong>
          <div className="config-row">
            <label>Pixel X:<input type="number" className="number-input-small" value={config.calibration?.point1?.pixel?.[0] ?? 0} onChange={e => updateNested(['calibration', 'point1', 'pixel', '0'], parseFloat(e.target.value))} /></label>
            <label>Pixel Y:<input type="number" className="number-input-small" value={config.calibration?.point1?.pixel?.[1] ?? 0} onChange={e => updateNested(['calibration', 'point1', 'pixel', '1'], parseFloat(e.target.value))} /></label>
          </div>
          <div className="config-row">
            <label>Val Rn:<input type="number" className="number-input-small" value={config.calibration?.point1?.value?.[0] ?? 0} onChange={e => updateNested(['calibration', 'point1', 'value', '0'], parseFloat(e.target.value))} /></label>
            <label>Val Kn:<input type="number" className="number-input-small" value={config.calibration?.point1?.value?.[1] ?? 0} onChange={e => updateNested(['calibration', 'point1', 'value', '1'], parseFloat(e.target.value))} /></label>
          </div>
        </div>

        <div className="coord-group">
          <strong>P2 (Reference)</strong>
          <div className="config-row">
            <label>Pixel X:<input type="number" className="number-input-small" value={config.calibration?.point2?.pixel?.[0] ?? 0} onChange={e => updateNested(['calibration', 'point2', 'pixel', '0'], parseFloat(e.target.value))} /></label>
            <label>Pixel Y:<input type="number" className="number-input-small" value={config.calibration?.point2?.pixel?.[1] ?? 0} onChange={e => updateNested(['calibration', 'point2', 'pixel', '1'], parseFloat(e.target.value))} /></label>
          </div>
          <div className="config-row">
            <label>Val Rn:<input type="number" className="number-input-small" value={config.calibration?.point2?.value?.[0] ?? 0} onChange={e => updateNested(['calibration', 'point2', 'value', '0'], parseFloat(e.target.value))} /></label>
            <label>Val Kn:<input type="number" className="number-input-small" value={config.calibration?.point2?.value?.[1] ?? 0} onChange={e => updateNested(['calibration', 'point2', 'value', '1'], parseFloat(e.target.value))} /></label>
          </div>
        </div>
      </details>

      <details className="config-section">
        <summary id="h-title" className="section-title">Horizontal Line Setting</summary>
        <p className="help-text">Controls the rendering of the capacity limit mapping horizontally across the Rn axis based on vertical Kn depth.</p>
        <div className="config-row">
           <label>Color: <input type="color" value={config.style?.horizontal_line?.color || '#000000'} onChange={e => updateNested(['style', 'horizontal_line', 'color'], e.target.value)}/></label>
           <label>Width: <input type="number" step="0.1" className="number-input-small" value={config.style?.horizontal_line?.linewidth ?? 1} onChange={e => updateNested(['style', 'horizontal_line', 'linewidth'], parseFloat(e.target.value))}/></label>
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
        <summary id="v-title" className="section-title">Vertical Line Setting</summary>
        <p className="help-text">Controls the limit mapping spanning vertically along the Kn axis driven by lateral Rn capacity thresholds.</p>
        <div className="config-row">
           <label>Color: <input type="color" value={config.style?.vertical_line?.color || '#000000'} onChange={e => updateNested(['style', 'vertical_line', 'color'], e.target.value)}/></label>
           <label>Width: <input type="number" step="0.1" className="number-input-small" value={config.style?.vertical_line?.linewidth ?? 1} onChange={e => updateNested(['style', 'vertical_line', 'linewidth'], parseFloat(e.target.value))}/></label>
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
        <summary id="r-title" className="section-title">Radial Line & Target</summary>
        <p className="help-text">Configures the extension projection vector spanning directly from the origin through the evaluated target load.</p>
        <div className="config-row">
           <label>Extension Px: <input type="number" className="number-input-small" value={config.style?.radial_line?.extension ?? 0} onChange={e => updateNested(['style', 'radial_line', 'extension'], parseFloat(e.target.value))}/></label>
        </div>
      </details>

    </div>
  );
};
