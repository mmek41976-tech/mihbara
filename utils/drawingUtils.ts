
import React from 'react';
import { Point, Stroke, BrushType, Project, Layer } from '../types';

export const getPressure = (e: React.PointerEvent | PointerEvent): number => {
  if (e.pointerType === 'mouse') return 0.5;
  const p = (e as any).pressure || (e as any).force || 0.5;
  return Math.pow(p, 0.7);
};

export const stabilizePoint = (points: Point[], nextPoint: Point, strength: number): Point => {
  if (points.length === 0 || strength <= 0) return nextPoint;
  
  const lastPoint = points[points.length - 1];
  
  const baseLerp = 1.0 - Math.min(0.98, strength * 0.9);
  const startBoost = points.length < 5 ? (5 - points.length) * 0.1 : 0;
  const lerpFactor = Math.min(1.0, baseLerp + startBoost);
  
  return {
    x: lastPoint.x + (nextPoint.x - lastPoint.x) * lerpFactor,
    y: lastPoint.y + (nextPoint.y - lastPoint.y) * lerpFactor,
    pressure: lastPoint.pressure + (nextPoint.pressure - lastPoint.pressure) * lerpFactor,
    timestamp: nextPoint.timestamp,
  };
};

const drawCalligraphyStamp = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  roundness: number,
  angleRad: number
) => {
  const width = size;
  const height = size * (roundness / 100);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angleRad);
  ctx.beginPath();
  ctx.ellipse(0, 0, width / 2, Math.max(0.4, height / 2), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

export const drawStroke = (
  ctx: CanvasRenderingContext2D,
  stroke: Stroke
) => {
  if (stroke.points.length === 0) return;
  if (stroke.points.some(p => isNaN(p.x) || isNaN(p.y))) {
    console.error("Attempted to draw a stroke with invalid (NaN) points.", stroke);
    return;
  }

  const { brushSettings, color, points } = stroke;

  ctx.save();
  // We only consider the brush's own opacity here. Layer opacity is handled during composition.
  ctx.globalAlpha = brushSettings.opacity || 1.0;

  if (stroke.brushId === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
  } else {
    // Strokes on the same layer should just draw over each other.
    ctx.globalCompositeOperation = 'source-over';
  }

  ctx.fillStyle = color;
  ctx.strokeStyle = color;

  const isCalligraphy = brushSettings.roundness < 100;
  
  if (isCalligraphy) {
    const angleRad = (brushSettings.angle * Math.PI) / 180;
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const dynamicSize = brushSettings.pressureSensitivity 
        ? brushSettings.minSize + (brushSettings.maxSize - brushSettings.minSize) * p.pressure
        : brushSettings.size;
      
      drawCalligraphyStamp(ctx, p.x, p.y, dynamicSize, brushSettings.roundness, angleRad);

      if (i > 0) {
        const prev = points[i-1];
        const dist = Math.hypot(p.x - prev.x, p.y - prev.y);
        const steps = Math.ceil(dist / Math.max(0.3, dynamicSize * 0.02));
        
        for(let s = 1; s < steps; s++) {
          const t = s / steps;
          const ix = prev.x + (p.x - prev.x) * t;
          const iy = prev.y + (p.y - prev.y) * t;
          const ip = prev.pressure + (p.pressure - prev.pressure) * t;
          const isize = brushSettings.pressureSensitivity 
            ? brushSettings.minSize + (brushSettings.maxSize - brushSettings.minSize) * ip
            : brushSettings.size;
          drawCalligraphyStamp(ctx, ix, iy, isize, brushSettings.roundness, angleRad);
        }
      }
    }
  } else {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (points.length > 1) {
      for (let i = 1; i < points.length; i++) {
        const p = points[i];
        const prev = points[i-1];
        ctx.beginPath();
        const lineWidth = brushSettings.pressureSensitivity 
          ? brushSettings.minSize + (brushSettings.maxSize - brushSettings.minSize) * p.pressure
          : brushSettings.size;
        ctx.lineWidth = Math.max(0.1, lineWidth); // Ensure lineWidth is not zero or negative
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
    } else if (points.length === 1) {
      const p = points[0];
      const size = brushSettings.pressureSensitivity 
        ? brushSettings.minSize + (brushSettings.maxSize - brushSettings.minSize) * p.pressure
        : brushSettings.size;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.1, size / 2), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
};
