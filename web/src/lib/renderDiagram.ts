import { calibrate, toPixel, evaluateConditionalLimits, resolveBoundary } from './math';

export function drawInteractionDiagram(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  kn: number,
  rn: number,
  config: any
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Ensure canvas matches image natively
  canvas.width = image.width;
  canvas.height = image.height;

  // Draw background
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0);

  try {
    if (!config?.calibration) return;
    
    const p1 = config.calibration.point1;
    const p2 = config.calibration.point2;
    const transform = calibrate(
      p1.pixel as [number, number],
      p1.value as [number, number],
      p2.pixel as [number, number],
      p2.value as [number, number]
    );

    const [px, py] = toPixel(rn, kn, transform);
    const [ox, oy] = toPixel(0, 0, transform);

    const style = config.style || {};
    const defStyle = { color: 'red', linewidth: 1.5 };

    // Helper to apply style
    const applyStyle = (s: any, defaultStyle = defStyle) => {
      ctx.strokeStyle = s?.color || defaultStyle.color;
      ctx.lineWidth = s?.linewidth || defaultStyle.linewidth;
      ctx.globalAlpha = s?.alpha ?? 1;
      if (s?.linestyle === '--' || s?.linestyle === ':') ctx.setLineDash([8, 8]);
      else ctx.setLineDash([]);
    };

    // Draw Horizontal Line
    const hStyle = { ...defStyle, ...(style.horizontal_line || {}) };
    // Default end to P2's Rn value ('auto') so lines match the chart boundary
    let hEndRn = hStyle.end_rn ?? 'auto';
    const hOverride = evaluateConditionalLimits(hStyle.conditional_limits, kn, rn, 'end_rn');
    if (hOverride !== null) hEndRn = hOverride;
    if (hEndRn === 'auto') hEndRn = p2.value[0]; // Use P2 Rn as boundary
    if (hEndRn === 'full') hEndRn = p2.value[0]; // Legacy 'full' also maps to P2

    let hStartRn = hStyle.start_rn ?? 0; // default start at origin Rn value (0)

    applyStyle(hStyle);
    ctx.beginPath();
    const hStartPx = resolveBoundary(hStartRn, px, transform, 'rn');
    const hEndPx = resolveBoundary(hEndRn, px, transform, 'rn');
    ctx.moveTo(hStartPx, py);
    ctx.lineTo(hEndPx, py);
    ctx.stroke();

    // Draw Vertical Line
    const vStyle = { ...defStyle, ...(style.vertical_line || {}) };
    // Default end to P2's Kn value ('auto') so lines match the chart boundary
    let vEndKn = vStyle.end_kn ?? 'auto';
    const vOverride = evaluateConditionalLimits(vStyle.conditional_limits, kn, rn, 'end_kn');
    if (vOverride !== null) vEndKn = vOverride;
    if (vEndKn === 'auto') vEndKn = p2.value[1]; // Use P2 Kn as boundary
    if (vEndKn === 'full') vEndKn = p2.value[1]; // Legacy 'full' also maps to P2

    let vStartKn = vStyle.start_kn ?? 0; // default start at origin Kn value (0)

    applyStyle(vStyle);
    ctx.beginPath();
    const vStartPy = resolveBoundary(vStartKn, py, transform, 'kn');
    const vEndPy = resolveBoundary(vEndKn, py, transform, 'kn');
    ctx.moveTo(px, vStartPy);
    ctx.lineTo(px, vEndPy);
    ctx.stroke();

    // Draw Radial Line
    const rStyle = { color: 'green', linewidth: 1, ...(style.radial_line || {}) };
    const extension = rStyle.extension || 0;
    let tx = px, ty = py;

    if (extension !== 0) {
      const dx = px - ox, dy = py - oy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        tx = px + (dx / dist) * extension;
        ty = py + (dy / dist) * extension;
      }
    }

    applyStyle(rStyle);
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(tx, ty);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    // Draw Dot
    const dStyle = { visible: true, color: 'blue', markersize: 4, ...(style.dot || {}) };
    if (dStyle.visible) {
      ctx.fillStyle = dStyle.color;
      ctx.beginPath();
      ctx.arc(px, py, dStyle.markersize, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Label
    const lStyle = { visible: true, fontsize: 14, color: 'white', facecolor: 'red', ...(style.label || {}) };
    if (lStyle.visible) {
      ctx.font = `bold ${lStyle.fontsize}px 'JetBrains Mono', monospace`;
      const text = `Rn = ${rn.toFixed(3)}  |  Kn = ${kn.toFixed(3)}`;
      const textMetrics = ctx.measureText(text);
      const padding = 10;

      ctx.fillStyle = lStyle.facecolor;
      ctx.globalAlpha = lStyle.alpha ?? 0.8;
      ctx.fillRect(px + 10, py - 30, textMetrics.width + padding * 2, 24 + padding);

      ctx.globalAlpha = 1;
      ctx.fillStyle = lStyle.color;
      ctx.fillText(text, px + 10 + padding, py - 14 + padding);
    }
  } catch (e) {
    console.error(e);
  }
}
