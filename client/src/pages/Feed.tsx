import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Heart, X, MapPin, Star, Shield } from "lucide-react";
import AppLayout from "./AppLayout";

interface ServiceCard {
  id: number;
  title: string;
  description: string;
  priceInTasklys: number;
  latitude: number;
  longitude: number;
  createdById: number;
  type: "offer" | "request";
  photos?: string[];
}

export default function Feed() {
  const { user } = useAuth();
  const [services, setServices] = useState<ServiceCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          // Default to Bogotá if location fails
          setUserLocation({
            latitude: 4.7110,
            longitude: -74.0055,
          });
        }
      );
    }
  }, []);

  // Fetch nearby services
  const { data: nearbyServices } = trpc.services.getNearby.useQuery(
    {
      latitude: userLocation?.latitude || 0,
      longitude: userLocation?.longitude || 0,
      radiusKm: 5,
      limit: 20,
    },
    { enabled: !!userLocation }
  );

  useEffect(() => {
    if (nearbyServices) {
      setServices(nearbyServices as ServiceCard[]);
      setLoading(false);
    }
  }, [nearbyServices]);

  const saveService = trpc.services.save.useMutation();

  const handleSwipeRight = async () => {
    if (currentIndex < services.length) {
      const service = services[currentIndex];
      await saveService.mutateAsync({ serviceId: service.id });
    }
    handleNext();
  };

  const handleSwipeLeft = () => {
    handleNext();
  };

  const handleNext = () => {
    setCurrentIndex((prev) => prev + 1);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="animate-spin w-12 h-12 text-blue-500" />
        </div>
      </AppLayout>
    );
  }

  if (currentIndex >= services.length) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <div className="text-4xl">🎉</div>
          <h2 className="text-2xl font-bold text-white">¡No hay más servicios!</h2>
          <p className="text-slate-400">Vuelve más tarde para ver nuevas tareas.</p>
          <Button
            onClick={() => setCurrentIndex(0)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Volver al inicio
          </Button>
        </div>
      </AppLayout>
    );
  }

  const currentService = services[currentIndex];
  const distance = calculateDistance(
    userLocation?.latitude || 0,
    userLocation?.longitude || 0,
    currentService.latitude,
    currentService.longitude
  );

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">¿Qué hay pa' hacer?</h1>
          <p className="text-slate-400">Desliza para descubrir servicios cercanos</p>
        </div>

        {/* Swipe Card */}
        <div className="relative h-96 mb-6">
          <Card className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 overflow-hidden">
            {/* Service Image */}
            <div className="relative h-48 bg-slate-700 flex items-center justify-center">
              {currentService.photos && currentService.photos.length > 0 ? (
                <img
                  src={currentService.photos[0]}
                  alt={currentService.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-4xl">📸</div>
              )}
              {/* Badges */}
              <div className="absolute top-4 right-4 flex gap-2">
                <div className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  4.8
                </div>
                <div className="bg-green-500/20 text-green-300 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Verificado
                </div>
              </div>
            </div>

            {/* Service Info */}
            <div className="p-6 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {currentService.title}
                </h2>
                <p className="text-slate-400 text-sm line-clamp-2">
                  {currentService.description}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  <span className="text-sm">{distance.toFixed(1)} km</span>
                </div>
                <div className="text-2xl font-bold text-blue-400">
                  {currentService.priceInTasklys} 💰
                </div>
              </div>

              <div className="pt-2 border-t border-slate-700">
                <p className="text-xs text-slate-500">
                  {currentService.type === "offer"
                    ? "Alguien ofrece este servicio"
                    : "Alguien necesita este servicio"}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button
            onClick={handleSwipeLeft}
            size="lg"
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-800 rounded-full w-16 h-16 flex items-center justify-center"
          >
            <X className="w-6 h-6" />
          </Button>
          <Button
            onClick={handleSwipeRight}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 rounded-full w-16 h-16 flex items-center justify-center"
          >
            <Heart className="w-6 h-6" />
          </Button>
        </div>

        {/* Progress */}
        <div className="mt-8 text-center text-sm text-slate-400">
          {currentIndex + 1} de {services.length}
        </div>
      </div>
    </AppLayout>
  );
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
