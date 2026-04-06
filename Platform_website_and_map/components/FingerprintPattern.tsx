"use client";

/**
 * Composant système d'empreinte digitale
 * Génère des motifs de cercles concentriques inspirés d'Echofield
 * Usage: arrière-plans, séparateurs, décors techniques discrets
 */

interface FingerprintPatternProps {
  variant?: "subtle" | "medium" | "strong";
  position?: "center" | "top-right" | "bottom-left" | "top-left";
  size?: number;
}

export default function FingerprintPattern({
  variant = "subtle",
  position = "center",
  size = 400,
}: FingerprintPatternProps) {
  const opacity = {
    subtle: 0.03,
    medium: 0.06,
    strong: 0.10,
  }[variant];

  const positionStyles = {
    center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
    "top-right": "top-0 right-0 translate-x-1/4 -translate-y-1/4",
    "bottom-left": "bottom-0 left-0 -translate-x-1/4 translate-y-1/4",
    "top-left": "top-0 left-0 -translate-x-1/4 -translate-y-1/4",
  }[position];

  return (
    <div
      className={`absolute ${positionStyles} pointer-events-none`}
      style={{ width: size, height: size, opacity }}
      aria-hidden="true"
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Cercles concentriques - empreinte digitale */}
        <circle
          cx="200"
          cy="200"
          r="180"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          className="text-congo-cyan"
        />
        <circle
          cx="200"
          cy="200"
          r="150"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          className="text-congo-cyan"
        />
        <circle
          cx="200"
          cy="200"
          r="120"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          strokeDasharray="4 4"
          className="text-congo-cyan"
        />
        <circle
          cx="200"
          cy="200"
          r="90"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          className="text-congo-cyan"
        />
        <circle
          cx="200"
          cy="200"
          r="60"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          strokeDasharray="8 4"
          className="text-congo-cyan"
        />
        <circle
          cx="200"
          cy="200"
          r="30"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          className="text-congo-cyan"
        />

        {/* Points de repère */}
        <circle cx="200" cy="200" r="3" fill="currentColor" className="text-congo-cyan" />
        <circle cx="200" cy="20" r="2" fill="currentColor" className="text-congo-cyan" />
        <circle cx="200" cy="380" r="2" fill="currentColor" className="text-congo-cyan" />
        <circle cx="20" cy="200" r="2" fill="currentColor" className="text-congo-cyan" />
        <circle cx="380" cy="200" r="2" fill="currentColor" className="text-congo-cyan" />
      </svg>
    </div>
  );
}

/**
 * Variante inline pour séparateurs
 */
export function FingerprintSeparator() {
  return (
    <div className="flex items-center justify-center py-8 relative">
      <div className="w-16 h-16 relative opacity-20">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="0.5"
            fill="none"
            className="text-congo-cyan"
          />
          <circle
            cx="32"
            cy="32"
            r="20"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
            className="text-congo-cyan"
          />
          <circle
            cx="32"
            cy="32"
            r="12"
            stroke="currentColor"
            strokeWidth="0.5"
            fill="none"
            strokeDasharray="2 2"
            className="text-congo-cyan"
          />
          <circle cx="32" cy="32" r="2" fill="currentColor" className="text-congo-cyan" />
        </svg>
      </div>
    </div>
  );
}
