import React, { useEffect, useRef, useState } from 'react';
import { drawInteractionDiagram } from './lib/renderDiagram';

interface DiagramCanvasProps {
  kn: number;
  rn: number;
  config: any;
}

export const DiagramCanvas: React.FC<DiagramCanvasProps> = ({ kn, rn, config }) => {
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

  }, [kn, rn, config, image]);

  return (
    <div className="canvas-container">
      {!image && <div className="loading-card">Loading image...</div>}
      <canvas 
        ref={canvasRef} 
        className="diagram-canvas"
      />
    </div>
  );
};
