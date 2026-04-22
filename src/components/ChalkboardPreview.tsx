'use client';

import { motion } from 'framer-motion';

const strokeBase = {
  fill: 'none',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const draw = (delay: number, duration = 1.4) => ({
  initial: { pathLength: 0, opacity: 0 },
  animate: { pathLength: 1, opacity: 1 },
  transition: { delay, duration, ease: [0.65, 0, 0.35, 1] as const },
});

export default function ChalkboardPreview() {
  return (
    <svg
      className="visual-svg"
      viewBox="0 0 500 400"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <filter id="chalk" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="3" />
          <feDisplacementMap in="SourceGraphic" scale="1.2" />
        </filter>
      </defs>

      {/* Axes */}
      <motion.line
        x1="70"
        y1="340"
        x2="440"
        y2="340"
        stroke="rgba(245,240,232,0.6)"
        strokeWidth="1.6"
        filter="url(#chalk)"
        style={strokeBase}
        {...draw(0.15, 0.9)}
      />
      <motion.line
        x1="90"
        y1="70"
        x2="90"
        y2="360"
        stroke="rgba(245,240,232,0.6)"
        strokeWidth="1.6"
        filter="url(#chalk)"
        style={strokeBase}
        {...draw(0.3, 0.9)}
      />

      {/* Sine wave */}
      <motion.path
        d="M 90 210 Q 130 110, 170 210 T 250 210 T 330 210 T 410 210"
        stroke="#6BBFFF"
        strokeWidth="2.4"
        filter="url(#chalk)"
        style={strokeBase}
        {...draw(1.2, 2.2)}
      />

      {/* Unit circle */}
      <motion.circle
        cx="220"
        cy="210"
        r="70"
        stroke="#FFE066"
        strokeWidth="2"
        fill="none"
        filter="url(#chalk)"
        {...draw(2.4, 1.6)}
      />

      {/* Radius line */}
      <motion.line
        x1="220"
        y1="210"
        x2="268"
        y2="160"
        stroke="#FF9ECD"
        strokeWidth="2.2"
        filter="url(#chalk)"
        style={strokeBase}
        {...draw(3.6, 0.7)}
      />

      {/* Angle arc */}
      <motion.path
        d="M 250 210 A 30 30 0 0 0 240 188"
        stroke="#7FD97F"
        strokeWidth="1.8"
        filter="url(#chalk)"
        style={strokeBase}
        {...draw(4.1, 0.7)}
      />

      {/* Handwritten label */}
      <motion.text
        x="310"
        y="150"
        fill="rgba(245,240,232,0.82)"
        fontFamily="Caveat, cursive"
        fontSize="26"
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 4.6, duration: 0.5 }}
      >
        sin(θ) = y
      </motion.text>

      <motion.text
        x="310"
        y="185"
        fill="rgba(245,240,232,0.55)"
        fontFamily="Caveat, cursive"
        fontSize="20"
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 4.9, duration: 0.5 }}
      >
        cos(θ) = x
      </motion.text>
    </svg>
  );
}
