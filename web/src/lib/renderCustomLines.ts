import type { CustomLine } from '../App';

/**
 * Draws all custom lines on the canvas.
 * Each custom line has an anchor (fixed point), angle, and length.
 * The line is drawn from the anchor to the computed endpoint.
 */
export function drawCustomLines(canvas: HTMLCanvasElement, lines: CustomLine[]) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  for (const line of lines) {
    if (!line.enabled) continue;

    // Convert angle from degrees to radians (0° = right, CCW positive)
    const rad = (line.angle * Math.PI) / 180;

    // Compute endpoint
    const endX = line.anchorX + line.length * Math.cos(rad);
    const endY = line.anchorY - line.length * Math.sin(rad); // Y is inverted in canvas

    // Style
    ctx.save();
    ctx.strokeStyle = line.color;
    ctx.lineWidth = line.lineWidth;
    ctx.globalAlpha = 1;
    ctx.setLineDash(line.lineDash ? [8, 6] : []);

    // Draw the line
    ctx.beginPath();
    ctx.moveTo(line.anchorX, line.anchorY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Draw anchor point indicator (small filled circle) — only if enabled
    if (line.showAnchor) {
      ctx.fillStyle = line.color;
      ctx.beginPath();
      ctx.arc(line.anchorX, line.anchorY, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw endpoint indicator (small hollow circle) — only if enabled
    if (line.showEndpoint) {
      ctx.beginPath();
      ctx.arc(endX, endY, 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw label if present
    if (line.label) {
      const midX = (line.anchorX + endX) / 2;
      const midY = (line.anchorY + endY) / 2;

      ctx.font = `bold 12px 'JetBrains Mono', monospace`;
      const textMetrics = ctx.measureText(line.label);
      const padding = 4;

      // Label background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(
        midX - textMetrics.width / 2 - padding,
        midY - 8 - padding,
        textMetrics.width + padding * 2,
        16 + padding * 2
      );

      // Label text
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(line.label, midX, midY);
    }

    ctx.restore();
  }
}
