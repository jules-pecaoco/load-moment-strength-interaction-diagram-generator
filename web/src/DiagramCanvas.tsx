import React, { useEffect, useRef, useState, useCallback } from 'react';
import { drawInteractionDiagram } from './lib/renderDiagram';

interface DiagramCanvasProps {
  kn: number;
  rn: number;
  config: any;
  pickingMode: 'p1' | 'p2' | null;
  onPointPicked: (x: number, y: number) => void;
}

export const DiagramCanvas: React.FC<DiagramCanvasProps> = ({ kn, rn, config, pickingMode, onPointPicked }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [canvasStyle, setCanvasStyle] = useState<{ width: string; height: string }>({ width: '100%', height: '100%' });

  useEffect(() => {
    if (!config?.image_path) return;
    const img = new Image();
    img.src = config.image_path;
    img.onload = () => setImage(img);
  }, [config?.image_path]);

  // Calculate the exact CSS size for the canvas to fit the container's
  // content area (excluding padding) while preserving the image aspect ratio.
  const fitCanvas = useCallback(() => {
    const container = containerRef.current;
    if (!container || !image) return;

    // Subtract padding to get the actual available content area
    const cs = getComputedStyle(container);
    const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    const availW = container.clientWidth - padX;
    const availH = container.clientHeight - padY;

    const imgAspect = image.width / image.height;
    const containerAspect = availW / availH;

    let cssWidth: number, cssHeight: number;
    if (containerAspect > imgAspect) {
      cssHeight = availH;
      cssWidth = availH * imgAspect;
    } else {
      cssWidth = availW;
      cssHeight = availW / imgAspect;
    }

    setCanvasStyle({ width: `${cssWidth}px`, height: `${cssHeight}px` });
  }, [image]);

  useEffect(() => {
    fitCanvas();
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => fitCanvas());
    observer.observe(container);
    return () => observer.disconnect();
  }, [fitCanvas]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image || !config?.calibration) return;

    drawInteractionDiagram(canvas, image, kn, rn, config);

    // Draw P1 and P2 calibration point markers on the canvas
    const showMarkers = config.calibration?.show_markers ?? true;
    const ctx = canvas.getContext('2d');
    if (ctx && showMarkers) {
      const p1px = config.calibration?.point1?.pixel;
      const p2px = config.calibration?.point2?.pixel;

      const drawMarker = (px: number[], color: string, label: string) => {
        if (!px || px.length < 2) return;
        const x = px[0], y = px[1];
        const arm = 12; // crosshair arm length in image pixels

        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.9;

        // Crosshair
        ctx.beginPath();
        ctx.moveTo(x - arm, y); ctx.lineTo(x + arm, y);
        ctx.moveTo(x, y - arm); ctx.lineTo(x, y + arm);
        ctx.stroke();

        // Circle
        ctx.beginPath();
        ctx.arc(x, y, arm * 0.6, 0, Math.PI * 2);
        ctx.stroke();

        // Label badge
        ctx.font = 'bold 11px Inter, sans-serif';
        const tw = ctx.measureText(label).width;
        const bx = x + arm + 4, by = y - arm;
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.roundRect(bx - 3, by - 12, tw + 6, 16, 3);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#fff';
        ctx.fillText(label, bx, by);

        ctx.restore();
      };

      drawMarker(p1px, '#2E6DA4', 'P1');
      drawMarker(p2px, '#D84C2A', 'P2');
    }

  }, [kn, rn, config, image]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!pickingMode || !image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Account for the canvas border — getBoundingClientRect includes it,
    // but the drawing surface starts inside the border.
    const cs = getComputedStyle(canvas);
    const borderL = parseFloat(cs.borderLeftWidth) || 0;
    const borderT = parseFloat(cs.borderTopWidth) || 0;
    const borderR = parseFloat(cs.borderRightWidth) || 0;
    const borderB = parseFloat(cs.borderBottomWidth) || 0;

    // Mouse position relative to the canvas content area (inside border)
    const mouseX = e.clientX - rect.left - borderL;
    const mouseY = e.clientY - rect.top - borderT;

    // Content area dimensions (excluding border)
    const contentW = rect.width - borderL - borderR;
    const contentH = rect.height - borderT - borderB;

    const scaleX = canvas.width / contentW;
    const scaleY = canvas.height / contentH;

    const imgX = mouseX * scaleX;
    const imgY = mouseY * scaleY;

    if (imgX >= 0 && imgX <= image.width && imgY >= 0 && imgY <= image.height) {
      onPointPicked(imgX, imgY);
    }
  };

  return (
    <div ref={containerRef} className={`canvas-container ${pickingMode ? 'picking-active' : ''}`}>
      {!image && <div className="loading-card">Loading image...</div>}
      <canvas 
        ref={canvasRef} 
        className="diagram-canvas"
        style={{ 
          ...canvasStyle,
          cursor: pickingMode ? 'crosshair' : 'default',
        }}
        onClick={handleCanvasClick}
      />
    </div>
  );
};
