import { supabase } from "./supabase";

export type NearbyService = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  taskly_price: number;
  lat: number;
  lng: number;
  status: "published" | "in_progress" | "completed" | "cancelled";
  distance_km: number;
};

export const NEARBY_RADIUS_KM = 3;

export async function fetchNearbyServices(
  lat: number,
  lng: number,
  radiusKm: number = NEARBY_RADIUS_KM
): Promise<NearbyService[]> {
  const { data, error } = await supabase.rpc("nearby_services", {
    p_lat: lat,
    p_lng: lng,
    p_radius_km: radiusKm,
  });

  if (error) {
    throw error;
  }

  return (data ?? []) as NearbyService[];
}
