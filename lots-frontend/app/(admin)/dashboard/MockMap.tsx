"use client"

const mockDots = [
  { x: 8, y: 28, color: "#2AC1A3", size: 8 },
  { x: 12, y: 55, color: "#2AC1A3", size: 10, ring: true },
  { x: 18, y: 48, color: "#2AC1A3", size: 7 },
  { x: 22, y: 62, color: "#2AC1A3", size: 8 },
  { x: 26, y: 45, color: "#2AC1A3", size: 7 },
  { x: 30, y: 52, color: "#2AC1A3", size: 8 },
  { x: 34, y: 38, color: "#2AC1A3", size: 7 },
  { x: 38, y: 48, color: "#2AC1A3", size: 9 },
  { x: 40, y: 30, color: "#2AC1A3", size: 7 },
  { x: 42, y: 55, color: "#2AC1A3", size: 8 },
  { x: 44, y: 42, color: "#C4943A", size: 8 },
  { x: 47, y: 22, color: "#2AC1A3", size: 10, ring: true },
  { x: 48, y: 50, color: "#2AC1A3", size: 7 },
  { x: 50, y: 38, color: "#2AC1A3", size: 8 },
  { x: 52, y: 60, color: "#C4943A", size: 8 },
  { x: 55, y: 45, color: "#2AC1A3", size: 7 },
  { x: 57, y: 32, color: "#2AC1A3", size: 8 },
  { x: 60, y: 52, color: "#C4943A", size: 8 },
  { x: 62, y: 25, color: "#2AC1A3", size: 10, ring: true },
  { x: 64, y: 42, color: "#2AC1A3", size: 7 },
  { x: 66, y: 55, color: "#C4943A", size: 8 },
  { x: 68, y: 35, color: "#2AC1A3", size: 8 },
  { x: 70, y: 48, color: "#2AC1A3", size: 7 },
  { x: 73, y: 30, color: "#2AC1A3", size: 8 },
  { x: 75, y: 55, color: "#C4943A", size: 8 },
  { x: 78, y: 40, color: "#2AC1A3", size: 7 },
  { x: 80, y: 28, color: "#2AC1A3", size: 8 },
  { x: 82, y: 50, color: "#2AC1A3", size: 7 },
  { x: 85, y: 35, color: "#2AC1A3", size: 8 },
  { x: 88, y: 45, color: "#2AC1A3", size: 7 },
  { x: 90, y: 30, color: "#2AC1A3", size: 8 },
  { x: 92, y: 55, color: "#C4943A", size: 8 },
  { x: 94, y: 42, color: "#2AC1A3", size: 7 },
]

export default function MockMap({
  conformes,
  nonVerifies,
  totalPoints,
}: {
  conformes: number
  nonVerifies: number
  totalPoints: number
}) {
  return (
    <div className="bg-[#1E2A35] rounded-xl overflow-hidden relative">
      <div className="absolute top-4 right-5 z-10">
        <span className="text-[9px] text-white/35 tracking-[0.15em] uppercase font-medium">
          {totalPoints} POINTS · MAPBOX
        </span>
      </div>

      <div className="relative h-[240px] mx-4 mt-4">
        {mockDots.map((dot, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${dot.x}%`,
              top: `${dot.y}%`,
            }}
          >
            {dot.ring ? (
              <div
                className="rounded-full border-2 flex items-center justify-center"
                style={{
                  width: dot.size * 2.2,
                  height: dot.size * 2.2,
                  borderColor: dot.color,
                }}
              >
                <div
                  className="rounded-full"
                  style={{
                    width: dot.size,
                    height: dot.size,
                    backgroundColor: dot.color,
                  }}
                />
              </div>
            ) : (
              <div
                className="rounded-full"
                style={{
                  width: dot.size,
                  height: dot.size,
                  backgroundColor: dot.color,
                  boxShadow: `0 0 6px ${dot.color}40`,
                }}
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-6 px-5 py-3.5">
        <span className="flex items-center gap-2 text-[10px] text-white/45 tracking-[0.1em] font-medium">
          <span className="w-2 h-2 rounded-full bg-[#2AC1A3]" />
          CONFORME ({conformes})
        </span>
        <span className="flex items-center gap-2 text-[10px] text-white/45 tracking-[0.1em] font-medium">
          <span className="w-2 h-2 rounded-full bg-[#94A3B8]" />
          NON VÉRIFIÉ ({nonVerifies})
        </span>
      </div>
    </div>
  )
}
