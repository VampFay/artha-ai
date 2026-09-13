/**
 * AnimatedFinancialChart — premium canvas-based chart for login screen.
 * Replaces the basic SVG path with a smooth, animated area chart with
 * gradient fill, grid lines, and a moving data point indicator.
 */
"use client";
import { useEffect, useRef, memo } from "react";

const AnimatedFinancialChart = memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let phase = 0;

    // Generate smooth data points (sine wave + trend)
    const generateData = (p: number, width: number): number[] => {
      const points: number[] = [];
      const count = 60;
      for (let i = 0; i < count; i++) {
        const t = i / count;
        const trend = t * 0.3; // upward trend
        const wave1 = Math.sin(t * Math.PI * 2 + p) * 0.15;
        const wave2 = Math.sin(t * Math.PI * 4 + p * 0.7) * 0.08;
        const noise = Math.sin(t * Math.PI * 8 + p * 1.3) * 0.04;
        const value = 0.3 + trend + wave1 + wave2 + noise;
        points.push(Math.max(0.1, Math.min(0.95, value)));
      }
      return points;
    };

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const dpr = window.devicePixelRatio || 1;

      if (canvas.width !== canvas.offsetWidth * dpr) {
        canvas.width = canvas.offsetWidth * dpr;
        canvas.height = canvas.offsetHeight * dpr;
        ctx.scale(dpr, dpr);
      }

      const cw = canvas.offsetWidth;
      const ch = canvas.offsetHeight;

      ctx.clearRect(0, 0, cw, ch);

      const data = generateData(phase, cw);

      // Draw grid lines (subtle)
      ctx.strokeStyle = "rgba(255,255,255,0.03)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = (ch / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(cw, y);
        ctx.stroke();
      }

      // Draw area fill (gradient)
      const gradient = ctx.createLinearGradient(0, 0, 0, ch);
      gradient.addColorStop(0, "rgba(245,158,11,0.25)");
      gradient.addColorStop(0.5, "rgba(245,158,11,0.08)");
      gradient.addColorStop(1, "rgba(245,158,11,0)");

      ctx.beginPath();
      ctx.moveTo(0, ch);
      for (let i = 0; i < data.length; i++) {
        const x = (i / (data.length - 1)) * cw;
        const y = ch - data[i] * ch * 0.8 - ch * 0.05;
        if (i === 0) ctx.lineTo(x, y);
        else {
          // Smooth curve using quadratic
          const prevX = ((i - 1) / (data.length - 1)) * cw;
          const prevY = ch - data[i - 1] * ch * 0.8 - ch * 0.05;
          const midX = (prevX + x) / 2;
          const midY = (prevY + y) / 2;
          ctx.quadraticCurveTo(prevX, prevY, midX, midY);
        }
      }
      ctx.lineTo(cw, ch);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw line (stroke)
      ctx.beginPath();
      for (let i = 0; i < data.length; i++) {
        const x = (i / (data.length - 1)) * cw;
        const y = ch - data[i] * ch * 0.8 - ch * 0.05;
        if (i === 0) ctx.moveTo(x, y);
        else {
          const prevX = ((i - 1) / (data.length - 1)) * cw;
          const prevY = ch - data[i - 1] * ch * 0.8 - ch * 0.05;
          const midX = (prevX + x) / 2;
          const midY = (prevY + y) / 2;
          ctx.quadraticCurveTo(prevX, prevY, midX, midY);
        }
      }
      ctx.strokeStyle = "rgba(245,158,11,0.7)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw moving data point (glowing dot at the end)
      const lastIdx = data.length - 1;
      const lastX = cw;
      const lastY = ch - data[lastIdx] * ch * 0.8 - ch * 0.05;

      // Glow
      const glowGrad = ctx.createRadialGradient(lastX, lastY, 0, lastX, lastY, 12);
      glowGrad.addColorStop(0, "rgba(251,191,36,0.6)");
      glowGrad.addColorStop(1, "rgba(251,191,36,0)");
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(lastX, lastY, 12, 0, Math.PI * 2);
      ctx.fill();

      // Dot
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
      ctx.fill();

      // Inner dot
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(lastX, lastY, 1.5, 0, Math.PI * 2);
      ctx.fill();

      phase += 0.005;
      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="absolute bottom-0 left-0 right-0 h-28 opacity-60 group-hover:opacity-90 transition-opacity duration-500">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
});

export default AnimatedFinancialChart;
