// src/services/directions/getDirections.ts
export type LatLng = { latitude: number; longitude: number };
export type DirectionsProvider = 'google' | 'osrm';
export type DirectionsMode = 'driving' | 'walking' | 'bicycling' | 'transit';

export type DirectionsResult = {
  coords: LatLng[];
  distanceMeters?: number;
  durationSeconds?: number;
  provider: DirectionsProvider;
};

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY; // define esto en tu .env / app.config

/** Decodifica un polyline (precision 1e-5) a una lista de LatLng */
function decodePolyline(encoded: string): LatLng[] {
  let index = 0, lat = 0, lng = 0, coordinates: LatLng[] = [];

  while (index < encoded.length) {
    let b, shift = 0, result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;

    shift = 0; result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += dlng;

    coordinates.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return coordinates;
}

async function getGoogleDirections(origin: LatLng, destination: LatLng, mode: DirectionsMode = 'driving'): Promise<DirectionsResult> {
  if (!GOOGLE_API_KEY) throw new Error('Missing EXPO_PUBLIC_GOOGLE_MAPS_API_KEY');

  const params = new URLSearchParams({
    origin: `${origin.latitude},${origin.longitude}`,
    destination: `${destination.latitude},${destination.longitude}`,
    mode,
    key: GOOGLE_API_KEY,
    alternatives: 'false',
  });

  const url = `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`;
  const res = await fetch(url);
  const json = await res.json();

  if (json.status !== 'OK' || !json.routes?.length) {
    throw new Error(`Google Directions error: ${json.status}`);
  }

  const route = json.routes[0];
  const overview = route.overview_polyline?.points as string | undefined;
  const legs = route.legs?.[0];

  const coords = overview ? decodePolyline(overview) : [];
  const distanceMeters = legs?.distance?.value;
  const durationSeconds = legs?.duration?.value;

  return { coords, distanceMeters, durationSeconds, provider: 'google' };
}

async function getOsrmDirections(origin: LatLng, destination: LatLng, mode: DirectionsMode = 'driving'): Promise<DirectionsResult> {
  // OSRM soporta driving/walking/cycling; "bicycling" -> cycling; "transit" no soportado -> fallback driving
  const profile = mode === 'walking' ? 'foot' : (mode === 'bicycling' ? 'bike' : 'car'); // algunos despliegues usan 'driving'/'walking'/'cycling'; el público admite 'driving'
  const profileRoute = mode === 'walking' ? 'foot' : (mode === 'bicycling' ? 'cycling' : 'driving');

  const url = `https://router.project-osrm.org/route/v1/${profileRoute}/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  const json = await res.json();

  if (json.code !== 'Ok' || !json.routes?.length) {
    throw new Error(`OSRM error: ${json.code || 'Unknown'}`);
  }

  const route = json.routes[0];
  const coords: LatLng[] = (route.geometry.coordinates as [number, number][])
    .map(([lon, lat]) => ({ latitude: lat, longitude: lon }));

  return {
    coords,
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    provider: 'osrm',
  };
}

export async function getDirections(
  origin: LatLng,
  destination: LatLng,
  options?: { mode?: DirectionsMode; forceProvider?: DirectionsProvider }
): Promise<DirectionsResult> {
  const mode = options?.mode ?? 'driving';
  const force = options?.forceProvider;

  // Si fuerzan proveedor, respeta
  if (force === 'google') return getGoogleDirections(origin, destination, mode);
  if (force === 'osrm') return getOsrmDirections(origin, destination, mode);

  // Por defecto: si hay key -> Google; si no -> OSRM
  if (GOOGLE_API_KEY) {
    try {
      return await getGoogleDirections(origin, destination, mode);
    } catch (_) {
      // Fallback si Google falla
      return await getOsrmDirections(origin, destination, mode);
    }
  }
  return await getOsrmDirections(origin, destination, mode);
}
