import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types pour les parcelles
export interface ParcelleGeoJSON {
  id: number;
  filename: string;
  geometry: {
    type: string;
    coordinates: number[][][];
  };
  created_at?: string;
}

// Fonction pour calculer l'aire d'un polygone (en m²)
export function calculateArea(coordinates: number[][][]): number {
  const R = 6371000; // Rayon de la Terre en mètres
  let area = 0;
  const coords = coordinates[0];

  for (let i = 0; i < coords.length - 1; i++) {
    const p1 = coords[i];
    const p2 = coords[i + 1];

    const lat1 = (p1[1] * Math.PI) / 180;
    const lat2 = (p2[1] * Math.PI) / 180;
    const dLon = ((p2[0] - p1[0]) * Math.PI) / 180;

    area += dLon * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  area = Math.abs((area * R * R) / 2);
  return area;
}

// Parser la géométrie
export function parseGeometry(geom: unknown): { type: string; coordinates: number[][][] } | null {
  if (typeof geom === "object" && geom !== null) {
    const g = geom as { type?: string; coordinates?: number[][][] };
    if (g.type && g.coordinates) {
      return { type: g.type, coordinates: g.coordinates };
    }
  }

  if (typeof geom === "string") {
    try {
      const parsed = JSON.parse(geom);
      if (parsed.type && parsed.coordinates) return parsed;
    } catch {
      // Ignore parse errors
    }
  }

  return null;
}
