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
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!config?.image_path) return;
    const img = new Image();
    img.src = config.image_path;
    img.onload = () => setImage(img);
  }, [config?.image_path]);

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

  return (
    <div className="canvas-container">
      {!image && <div className="loading-card">Loading image...</div>}
      <canvas
        ref={canvasRef}
        className={`diagram-canvas${pickingAnchorId ? ' picking-mode' : ''}`}
        onClick={handleClick}
      />
    </div>
  );
};
