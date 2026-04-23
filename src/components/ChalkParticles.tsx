'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  opacity: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  // Decomposed RGBA so we never build a string per frame
  r: number;
  g: number;
  b: number;
}

// Pre-parsed RGB values matching the original chalk-dust palette
const CHALK_DUST_COLORS: [number, number, number][] = [
  [245, 240, 232], // warm white
  [255, 224, 102], // yellow
  [127, 217, 127], // green
  [107, 191, 255], // blue
];

interface ChalkParticlesProps {
  count?: number;
  className?: string;
  colors?: [number, number, number][];
}

export default function ChalkParticles({ count = 30, className = '', colors }: ChalkParticlesProps) {
  const palette = colors && colors.length > 0 ? colors : CHALK_DUST_COLORS;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    // passive: true avoids blocking the browser's scroll/paint pipeline
    window.addEventListener('resize', resize, { passive: true });

    const spawnParticle = (): Particle => {
      const [r, g, b] = palette[Math.floor(Math.random() * palette.length)];
      return {
        x: Math.random() * canvas.width,
        y: canvas.height * (0.4 + Math.random() * 0.5),
        size: 1 + Math.random() * 2.5,
        opacity: 0.1 + Math.random() * 0.4,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -(0.3 + Math.random() * 0.6),
        life: 0,
        maxLife: 120 + Math.random() * 180,
        r,
        g,
        b,
      };
    };

    // Reset array on every effect run so count changes don't stack particles
    particlesRef.current = [];
    for (let i = 0; i < count; i++) {
      const p = spawnParticle();
      p.life = Math.random() * p.maxLife; // stagger initial lifetimes
      particlesRef.current.push(p);
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.vy -= 0.003;

        if (p.life >= p.maxLife) {
          particles[i] = spawnParticle();
          continue;
        }

        const lifeRatio = p.life / p.maxLife;
        // Use globalAlpha instead of building a string with toFixed every frame
        const alpha = p.opacity * (1 - lifeRatio) * Math.sin(lifeRatio * Math.PI);

        ctx.globalAlpha = alpha;
        ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Restore default alpha so other canvas consumers aren't affected
      ctx.globalAlpha = 1;

      animRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
      window.removeEventListener('resize', resize);
    };
  }, [count, palette]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ zIndex: 0 }}
    />
  );
}
