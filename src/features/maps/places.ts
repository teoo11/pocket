import { normalizeText } from "@/features/jobs/safety"

/**
 * The 80 Bucharest and Ilfov places (neighbourhoods and towns) from the prototype. The same list is in
 * the database (public.places, see supabase/migrations/*_places.sql), which names a job's area.
 */
export type Place = { id: number; name: string; zone: string; lat: number; lng: number }

export const PLACES: readonly Place[] = [
  { id: 1, name: "Floreasca", zone: "Sector 1", lat: 44.4598, lng: 26.1047 },
  { id: 2, name: "Dorobanți", zone: "Sector 1", lat: 44.456, lng: 26.092 },
  { id: 3, name: "Primăverii", zone: "Sector 1", lat: 44.465, lng: 26.087 },
  { id: 4, name: "Aviatorilor", zone: "Sector 1", lat: 44.461, lng: 26.086 },
  { id: 5, name: "Herăstrău", zone: "Sector 1", lat: 44.472, lng: 26.08 },
  { id: 6, name: "Băneasa", zone: "Sector 1", lat: 44.495, lng: 26.078 },
  { id: 7, name: "Bucureștii Noi", zone: "Sector 1", lat: 44.48, lng: 26.045 },
  { id: 8, name: "Damaroaia", zone: "Sector 1", lat: 44.49, lng: 26.06 },
  { id: 9, name: "Domenii", zone: "Sector 1", lat: 44.465, lng: 26.065 },
  { id: 10, name: "Piața Victoriei", zone: "Sector 1", lat: 44.452, lng: 26.086 },
  { id: 11, name: "Piața Romană", zone: "Sector 1", lat: 44.446, lng: 26.0975 },
  { id: 12, name: "Grivița", zone: "Sector 1", lat: 44.46, lng: 26.065 },
  { id: 13, name: "Tei", zone: "Sector 2", lat: 44.458, lng: 26.127 },
  { id: 14, name: "Colentina", zone: "Sector 2", lat: 44.456, lng: 26.145 },
  { id: 15, name: "Obor", zone: "Sector 2", lat: 44.45, lng: 26.125 },
  { id: 16, name: "Ștefan cel Mare", zone: "Sector 2", lat: 44.452, lng: 26.11 },
  { id: 17, name: "Iancului", zone: "Sector 2", lat: 44.44, lng: 26.142 },
  { id: 18, name: "Pantelimon", zone: "Sector 2", lat: 44.442, lng: 26.17 },
  { id: 19, name: "Pipera", zone: "Sector 2", lat: 44.5, lng: 26.118 },
  { id: 20, name: "Moșilor", zone: "Sector 2", lat: 44.442, lng: 26.115 },
  { id: 21, name: "Centrul Vechi", zone: "Sector 3", lat: 44.432, lng: 26.101 },
  { id: 22, name: "Universitate", zone: "Sector 3", lat: 44.4355, lng: 26.1015 },
  { id: 23, name: "Unirii", zone: "Sector 3", lat: 44.4268, lng: 26.1025 },
  { id: 24, name: "Titan", zone: "Sector 3", lat: 44.422, lng: 26.175 },
  { id: 25, name: "Dristor", zone: "Sector 3", lat: 44.418, lng: 26.143 },
  { id: 26, name: "Vitan", zone: "Sector 3", lat: 44.41, lng: 26.135 },
  { id: 27, name: "Balta Albă", zone: "Sector 3", lat: 44.415, lng: 26.16 },
  { id: 28, name: "Văcărești", zone: "Sector 4", lat: 44.402, lng: 26.123 },
  { id: 29, name: "Tineretului", zone: "Sector 4", lat: 44.408, lng: 26.108 },
  { id: 30, name: "Berceni", zone: "Sector 4", lat: 44.38, lng: 26.12 },
  { id: 31, name: "Olteniței", zone: "Sector 4", lat: 44.388, lng: 26.12 },
  { id: 32, name: "Giurgiului", zone: "Sector 4", lat: 44.39, lng: 26.085 },
  { id: 33, name: "Rahova", zone: "Sector 5", lat: 44.405, lng: 26.055 },
  { id: 34, name: "Ferentari", zone: "Sector 5", lat: 44.402, lng: 26.07 },
  { id: 35, name: "Cotroceni", zone: "Sector 5", lat: 44.432, lng: 26.07 },
  { id: 36, name: "13 Septembrie", zone: "Sector 5", lat: 44.417, lng: 26.07 },
  { id: 37, name: "Drumul Taberei", zone: "Sector 6", lat: 44.421, lng: 26.03 },
  { id: 38, name: "Militari", zone: "Sector 6", lat: 44.435, lng: 26.01 },
  { id: 39, name: "Crângași", zone: "Sector 6", lat: 44.45, lng: 26.04 },
  { id: 40, name: "Giulești", zone: "Sector 6", lat: 44.456, lng: 26.045 },
  { id: 41, name: "Lujerului", zone: "Sector 6", lat: 44.434, lng: 26.031 },
  { id: 42, name: "Otopeni", zone: "Ilfov", lat: 44.55, lng: 26.07 },
  { id: 43, name: "Voluntari", zone: "Ilfov", lat: 44.49, lng: 26.18 },
  { id: 44, name: "Pantelimon (oraș)", zone: "Ilfov", lat: 44.453, lng: 26.21 },
  { id: 45, name: "Popești-Leordeni", zone: "Ilfov", lat: 44.38, lng: 26.17 },
  { id: 46, name: "Bragadiru", zone: "Ilfov", lat: 44.37, lng: 25.98 },
  { id: 47, name: "Chiajna", zone: "Ilfov", lat: 44.46, lng: 25.975 },
  { id: 48, name: "Buftea", zone: "Ilfov", lat: 44.565, lng: 25.95 },
  { id: 49, name: "Măgurele", zone: "Ilfov", lat: 44.35, lng: 26.03 },
  { id: 50, name: "Chitila", zone: "Ilfov", lat: 44.51, lng: 25.98 },
  { id: 51, name: "Mogoșoaia", zone: "Ilfov", lat: 44.53, lng: 25.997 },
  { id: 52, name: "Snagov", zone: "Ilfov", lat: 44.7, lng: 26.17 },
  { id: 53, name: "Corbeanca", zone: "Ilfov", lat: 44.6, lng: 26.04 },
  { id: 54, name: "Tunari", zone: "Ilfov", lat: 44.545, lng: 26.14 },
  { id: 55, name: "Ștefăneștii de Jos", zone: "Ilfov", lat: 44.59, lng: 26.19 },
  { id: 56, name: "Afumați", zone: "Ilfov", lat: 44.525, lng: 26.25 },
  { id: 57, name: "Cernica", zone: "Ilfov", lat: 44.42, lng: 26.29 },
  { id: 58, name: "Glina", zone: "Ilfov", lat: 44.385, lng: 26.25 },
  { id: 59, name: "Jilava", zone: "Ilfov", lat: 44.333, lng: 26.077 },
  { id: 60, name: "Domnești", zone: "Ilfov", lat: 44.4, lng: 25.92 },
  { id: 61, name: "Cornetu", zone: "Ilfov", lat: 44.35, lng: 25.95 },
  { id: 62, name: "Berceni (Ilfov)", zone: "Ilfov", lat: 44.315, lng: 26.12 },
  { id: 63, name: "1 Decembrie", zone: "Ilfov", lat: 44.29, lng: 26.06 },
  { id: 64, name: "Balotești", zone: "Ilfov", lat: 44.61, lng: 26.11 },
  { id: 65, name: "Ciolpani", zone: "Ilfov", lat: 44.73, lng: 26.08 },
  { id: 66, name: "Periș", zone: "Ilfov", lat: 44.69, lng: 26 },
  { id: 67, name: "Moara Vlăsiei", zone: "Ilfov", lat: 44.64, lng: 26.21 },
  { id: 68, name: "Brănești", zone: "Ilfov", lat: 44.46, lng: 26.33 },
  { id: 69, name: "Ciorogârla", zone: "Ilfov", lat: 44.44, lng: 25.88 },
  { id: 70, name: "Clinceni", zone: "Ilfov", lat: 44.37, lng: 25.95 },
  { id: 71, name: "Vidra", zone: "Ilfov", lat: 44.27, lng: 26.16 },
  { id: 72, name: "Dobroești", zone: "Ilfov", lat: 44.465, lng: 26.165 },
  { id: 73, name: "Dascălu", zone: "Ilfov", lat: 44.6, lng: 26.24 },
  { id: 74, name: "Gruiu", zone: "Ilfov", lat: 44.73, lng: 26.22 },
  { id: 75, name: "Nuci", zone: "Ilfov", lat: 44.71, lng: 26.3 },
  { id: 76, name: "Petrăchioaia", zone: "Ilfov", lat: 44.58, lng: 26.31 },
  { id: 77, name: "Găneasa", zone: "Ilfov", lat: 44.42, lng: 26.33 },
  { id: 78, name: "Dărăști", zone: "Ilfov", lat: 44.31, lng: 26 },
  { id: 79, name: "Copăceni", zone: "Ilfov", lat: 44.25, lng: 26.07 },
  { id: 80, name: "Dragomirești-Vale", zone: "Ilfov", lat: 44.45, lng: 25.92 },]

/** Where Pocket works: the box the database checks (private.in_service_area). */
export const SERVICE_BOUNDS = { south: 44.18, west: 25.65, north: 44.82, east: 26.55 } as const

export const DEFAULT_CENTER = { lat: 44.4598, lng: 26.1047 } // Floreasca

/** Places whose name or zone contains the query, ignoring case and diacritics ("stefan" finds "Ștefan cel Mare"). */
export function findPlaces(query: string): Place[] {
  const q = normalizeText(query).trim()
  if (!q) return [...PLACES]
  return PLACES.filter((p) => normalizeText(`${p.name} ${p.zone}`).includes(q))
}

export function placeById(id: number): Place | undefined {
  return PLACES.find((p) => p.id === id)
}

export function inServiceArea(lat: number, lng: number): boolean {
  return lat >= SERVICE_BOUNDS.south && lat <= SERVICE_BOUNDS.north && lng >= SERVICE_BOUNDS.west && lng <= SERVICE_BOUNDS.east
}

/** The closest of the 80 places (as the database names a job's area; there it is measured with PostGIS). */
export function nearestPlace(lat: number, lng: number): Place {
  const k = Math.cos((lat * Math.PI) / 180)
  let best = PLACES[0]
  let bestD = Infinity
  for (const p of PLACES) {
    const d = (p.lat - lat) ** 2 + ((p.lng - lng) * k) ** 2
    if (d < bestD) {
      bestD = d
      best = p
    }
  }
  return best
}
