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
  color: string;
}

const CHALK_DUST_COLORS = [
  'rgba(245,240,232,',
  'rgba(255,224,102,',
  'rgba(127,217,127,',
  'rgba(107,191,255,',
];

export default function ChalkParticles({ count = 30, className = '' }: { count?: number; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);

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
    window.addEventListener('resize', resize);

    const spawnParticle = (): Particle => {
      const colorBase = CHALK_DUST_COLORS[Math.floor(Math.random() * CHALK_DUST_COLORS.length)];
      return {
        x: Math.random() * canvas.width,
        y: canvas.height * (0.4 + Math.random() * 0.5),
        size: 1 + Math.random() * 2.5,
        opacity: 0.1 + Math.random() * 0.4,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -(0.3 + Math.random() * 0.6),
        life: 0,
        maxLife: 120 + Math.random() * 180,
        color: colorBase,
      };
    };

    // Initial particles
    for (let i = 0; i < count; i++) {
      const p = spawnParticle();
      p.life = Math.random() * p.maxLife;
      particlesRef.current.push(p);
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((p, i) => {
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.vy -= 0.003;

        const lifeRatio = p.life / p.maxLife;
        const alpha = p.opacity * (1 - lifeRatio) * Math.sin(lifeRatio * Math.PI);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${alpha.toFixed(3)})`;
        ctx.fill();

        if (p.life >= p.maxLife) {
          particlesRef.current[i] = spawnParticle();
        }
      });

      animRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ zIndex: 0 }}
    />
  );
}
