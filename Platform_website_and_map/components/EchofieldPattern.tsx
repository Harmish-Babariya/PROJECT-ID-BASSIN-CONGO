"use client";

/**
 * Empreinte digitale Echofield Alliance
 * Pattern de cercles concentriques officiels
 */

interface EchofieldPatternProps {
  opacity?: number;
  position?: "center" | "top-right" | "bottom-left" | "top-left" | "center-right";
  size?: number;
  className?: string;
}

export default function EchofieldPattern({
  opacity = 0.08,
  position = "center-right",
  size = 600,
  className = "",
}: EchofieldPatternProps) {
  const positionStyles = {
    center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
    "top-right": "top-0 right-0 translate-x-1/3 -translate-y-1/3",
    "bottom-left": "bottom-0 left-0 -translate-x-1/3 translate-y-1/3",
    "top-left": "top-0 left-0 -translate-x-1/3 -translate-y-1/3",
    "center-right": "top-1/2 right-0 translate-x-1/4 -translate-y-1/2",
  }[position];

  return (
    <div
      className={`absolute ${positionStyles} pointer-events-none ${className}`}
      style={{ width: size, height: size, opacity }}
      aria-hidden="true"
    >
      {/* Empreinte Echofield - cercles concentriques subtils */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 600 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Cercles externes - très légers */}
        <circle
          cx="300"
          cy="300"
          r="280"
          stroke="currentColor"
          strokeWidth="0.5"
          fill="none"
          className="text-congo-cyan"
          opacity="0.3"
        />
        <circle
          cx="300"
          cy="300"
          r="250"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          className="text-congo-cyan"
          opacity="0.4"
        />

        {/* Cercles moyens - plus visibles */}
        <circle
          cx="300"
          cy="300"
          r="220"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          className="text-congo-cyan"
          opacity="0.5"
        />
        <circle
          cx="300"
          cy="300"
          r="190"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          strokeDasharray="6 4"
          className="text-congo-cyan"
          opacity="0.6"
        />
        <circle
          cx="300"
          cy="300"
          r="160"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          className="text-congo-cyan"
          opacity="0.7"
        />

        {/* Cercles internes - emphase */}
        <circle
          cx="300"
          cy="300"
          r="130"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          strokeDasharray="10 6"
          className="text-congo-cyan"
          opacity="0.8"
        />
        <circle
          cx="300"
          cy="300"
          r="100"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
          className="text-congo-cyan"
          opacity="0.9"
        />
        <circle
          cx="300"
          cy="300"
          r="70"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeDasharray="4 3"
          className="text-congo-cyan"
          opacity="0.9"
        />
        <circle
          cx="300"
          cy="300"
          r="40"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          className="text-congo-cyan"
          opacity="1"
        />

        {/* Centre - point focal */}
        <circle
          cx="300"
          cy="300"
          r="5"
          fill="currentColor"
          className="text-congo-cyan"
          opacity="0.8"
        />

        {/* Points de repère cardinaux */}
        <circle cx="300" cy="20" r="2.5" fill="currentColor" className="text-congo-cyan" opacity="0.5" />
        <circle cx="300" cy="580" r="2.5" fill="currentColor" className="text-congo-cyan" opacity="0.5" />
        <circle cx="20" cy="300" r="2.5" fill="currentColor" className="text-congo-cyan" opacity="0.5" />
        <circle cx="580" cy="300" r="2.5" fill="currentColor" className="text-congo-cyan" opacity="0.5" />
      </svg>
    </div>
  );
}

/**
 * Variante inline petite pour séparateurs
 */
export function EchofieldMini() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="w-20 h-20 relative" style={{ opacity: 0.15 }}>
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="40"
            cy="40"
            r="35"
            stroke="currentColor"
            strokeWidth="0.5"
            fill="none"
            className="text-congo-cyan"
          />
          <circle
            cx="40"
            cy="40"
            r="25"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            className="text-congo-cyan"
          />
          <circle
            cx="40"
            cy="40"
            r="15"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
            strokeDasharray="2 2"
            className="text-congo-cyan"
          />
          <circle cx="40" cy="40" r="3" fill="currentColor" className="text-congo-cyan" />
        </svg>
      </div>
    </div>
  );
}
