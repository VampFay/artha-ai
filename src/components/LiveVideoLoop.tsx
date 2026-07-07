"use client";
import { memo, useRef, useEffect } from "react";

/**
 * LiveVideoLoop — Interactive canvas with floating currency symbols.
 * Particles have varying Z-depth for parallax, react to mouse (repel + constellation lines).
 * Memoized to prevent re-renders on parent state changes.
 */
const NOISE_SVG_URL = "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";

const CURRENCIES = ["$", "€", "£", "¥", "₹"];
const PARTICLE_COUNT = 35;
const CONNECT_DISTANCE = 120;
const MOUSE_REPEL_DISTANCE = 80;

interface Particle {
  x: number; y: number; z: number;
  vx: number; vy: number;
  symbol: string;
  size: number;
  opacity: number;
}

function LiveVideoLoopImpl() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -999, y: -999 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0, height = 0;
    let particles: Particle[] = [];

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      width = parent.clientWidth;
      height = parent.clientHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    const initParticles = () => {
      particles = Array.from({ length: PARTICLE_COUNT }, () => {
        const z = Math.random();
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          z,
          vx: (Math.random() - 0.5) * 0.3 * (z + 0.2),
          vy: (Math.random() - 0.5) * 0.3 * (z + 0.2),
          symbol: CURRENCIES[Math.floor(Math.random() * CURRENCIES.length)],
          size: 10 + z * 22,
          opacity: 0.05 + z * 0.15,
        };
      });
    };

    const handleMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const handleMouseLeave = () => { mouseRef.current = { x: -999, y: -999 }; };

    resize();
    initParticles();

    const handleResize = () => { resize(); initParticles(); };
    window.addEventListener("resize", handleResize);
    canvas.parentElement?.addEventListener("mousemove", handleMouse);
    canvas.parentElement?.addEventListener("mouseleave", handleMouseLeave);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Update particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;

        // Mouse repel
        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_REPEL_DISTANCE && dist > 0) {
          const force = (1 - dist / MOUSE_REPEL_DISTANCE) * 2;
          p.x += (dx / dist) * force;
          p.y += (dy / dist) * force;
        }
      }

      // Draw constellation lines (connections between nearby particles)
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_DISTANCE) {
            const alpha = (1 - dist / CONNECT_DISTANCE) * 0.1 * Math.max(particles[i].z, particles[j].z);
            ctx.strokeStyle = `rgba(245, 158, 11, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }

        // Draw lines to mouse
        const mdx = particles[i].x - mx;
        const mdy = particles[i].y - my;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < CONNECT_DISTANCE * 1.5) {
          const alpha = (1 - mdist / (CONNECT_DISTANCE * 1.5)) * 0.15;
          ctx.strokeStyle = `rgba(16, 185, 129, ${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(mx, my);
          ctx.stroke();
        }
      }

      // Draw particles (currency symbols)
      for (const p of particles) {
        ctx.font = `${p.size}px var(--font-geist-mono), monospace`;
        ctx.fillStyle = `rgba(245, 158, 11, ${p.opacity})`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(p.symbol, p.x, p.y);
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", handleResize);
      canvas.parentElement?.removeEventListener("mousemove", handleMouse);
      canvas.parentElement?.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div className="absolute inset-0">
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="noise-overlay" style={{ backgroundImage: NOISE_SVG_URL }} />
    </div>
  );
}

export const LiveVideoLoop = memo(LiveVideoLoopImpl);
