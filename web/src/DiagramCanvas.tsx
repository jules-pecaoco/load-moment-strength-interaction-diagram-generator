import React, { useEffect, useRef, useState, useCallback } from 'react';
import { drawInteractionDiagram } from './lib/renderDiagram';
import { drawCustomLines } from './lib/renderCustomLines';
import type { CustomLine } from './App';

interface DiagramCanvasProps {
  kn: number;
  rn: number;
  config: any;
  customLines: CustomLine[];
  pickingAnchorId: string | null;
  onCanvasClick: (pixelX: number, pixelY: number) => void;
}

export const DiagramCanvas: React.FC<DiagramCanvasProps> = ({
  kn, rn, config, customLines, pickingAnchorId, onCanvasClick,
}) => {
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
    drawCustomLines(canvas, customLines);

  }, [kn, rn, config, image, customLines]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!pickingAnchorId) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    // Account for object-fit: contain letterboxing.
    // The canvas content maintains its aspect ratio inside the CSS rect,
    // so the rendered area may be smaller than rect on one axis.
    const canvasAspect = canvas.width / canvas.height;
    const rectAspect = rect.width / rect.height;

    let renderedWidth: number, renderedHeight: number;
    let offsetX: number, offsetY: number;

    if (canvasAspect > rectAspect) {
      // Canvas is wider than rect → content is full-width, letterboxed vertically
      renderedWidth = rect.width;
      renderedHeight = rect.width / canvasAspect;
      offsetX = 0;
      offsetY = (rect.height - renderedHeight) / 2;
    } else {
      // Canvas is taller than rect → content is full-height, letterboxed horizontally
      renderedHeight = rect.height;
      renderedWidth = rect.height * canvasAspect;
      offsetX = (rect.width - renderedWidth) / 2;
      offsetY = 0;
    }

    // Position within the rendered content area
    const contentX = e.clientX - rect.left - offsetX;
    const contentY = e.clientY - rect.top - offsetY;

    // Convert to native canvas coordinates
    const pixelX = (contentX / renderedWidth) * canvas.width;
    const pixelY = (contentY / renderedHeight) * canvas.height;

    onCanvasClick(pixelX, pixelY);
  }, [pickingAnchorId, onCanvasClick]);

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
        className={`diagram-canvas${pickingAnchorId ? ' picking-mode' : ''}`}
        onClick={handleClick}
      />
    </div>
  );
};
