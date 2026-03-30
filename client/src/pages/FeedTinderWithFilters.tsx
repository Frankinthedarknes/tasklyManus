import { useState, useEffect, useRef } from "react";
import { Heart, X, MapPin, Star, ChevronUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import FilterPanel, { FilterState } from "@/components/FilterPanel";

interface ServiceCard {
  id: number;
  title: string;
  description: string;
  category: string;
  priceInTasklys: number;
  latitude: number;
  longitude: number;
  urgency: string;
  createdById: number;
  creatorName?: string;
  creatorLevel?: number;
  creatorRating?: number;
  distance?: number;
}

export default function FeedTinderWithFilters() {
  const [cards, setCards] = useState<ServiceCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<ServiceCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [userLocation, setUserLocation] = useState({ lat: 40.7128, lng: -74.006 });
  // Load filters from localStorage or use defaults
  const [filters, setFilters] = useState<FilterState>(() => {
    const saved = localStorage.getItem('taskly_filters');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved filters', e);
      }
    }
    return {
      categories: [],
      priceMin: 0,
      priceMax: 1000,
      maxDistance: 50,
      urgencies: [],
    };
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Fetch services with filters
  const { data: servicesData, isLoading } = trpc.services.getFiltered.useQuery({
    latitude: userLocation.lat,
    longitude: userLocation.lng,
    maxDistance: filters.maxDistance,
    categories: filters.categories.length > 0 ? filters.categories : undefined,
    priceMin: filters.priceMin,
    priceMax: filters.priceMax,
    urgencies: filters.urgencies.length > 0 ? (filters.urgencies as any) : undefined,
    limit: 50,
  });

  useEffect(() => {
    if (servicesData) {
      const enrichedCards = servicesData.map((service: any) => ({
        ...service,
        distance: calculateDistance(
          userLocation.lat,
          userLocation.lng,
          service.latitude,
          service.longitude
        ),
      }));
      setCards(enrichedCards);
      setFilteredCards(enrichedCards);
      setCurrentIndex(0);
    }
  }, [servicesData]);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          console.log("Using default location");
        }
      );
    }
  }, []);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentIndex(0);
    // Save filters to localStorage
    localStorage.setItem('taskly_filters', JSON.stringify(newFilters));
  };

  const handleSwipe = (direction: "left" | "right") => {
    if (currentIndex < filteredCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowDetails(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setTouchEnd(e.changedTouches[0].clientX);
    if (touchStart - touchEnd > 75) {
      handleSwipe("left");
    }
    if (touchEnd - touchStart > 75) {
      handleSwipe("right");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Buscando servicios cercanos...</p>
        </div>
      </div>
    );
  }

  if (filteredCards.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <p className="text-white text-xl mb-4">No hay servicios disponibles con estos filtros</p>
          <Button onClick={() => window.location.reload()}>Recargar</Button>
        </div>
      </div>
    );
  }

  const currentCard = filteredCards[currentIndex];
  const urgencyColors = {
    now: "bg-red-500",
    today: "bg-orange-500",
    flexible: "bg-green-500",
  };

  const urgencyLabels = {
    now: "Ahora",
    today: "Hoy",
    flexible: "Flexible",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Descubre Servicios</h1>
        <div className="flex items-center gap-4">
          <FilterPanel
            onFiltersChange={handleFiltersChange}
            resultsCount={filteredCards.length}
          />
          <div className="text-sm text-gray-400">
            {currentIndex + 1} de {filteredCards.length}
          </div>
        </div>
      </div>

      {/* Card Stack */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center relative"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="w-full max-w-sm">
          {/* Main Card */}
          <Card className="relative overflow-hidden shadow-2xl bg-slate-800 border-0 h-96 cursor-grab active:cursor-grabbing">
            {/* Background Image / Service Visual */}
            <div
              className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center"
              onClick={() => setShowDetails(!showDetails)}
            >
              <div className="text-center text-white px-6">
                <div className="text-6xl mb-4">
                  {currentCard.category === "electricidad" && "⚡"}
                  {currentCard.category === "plomería" && "🔧"}
                  {currentCard.category === "limpieza" && "🧹"}
                  {currentCard.category === "diseño" && "🎨"}
                  {currentCard.category === "tecnología" && "💻"}
                  {currentCard.category === "fitness" && "💪"}
                  {currentCard.category === "educación" && "📚"}
                  {currentCard.category === "reparación" && "🔩"}
                </div>
              </div>

              {/* Overlay with Service Info */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-between p-6">
                {/* Top Badge */}
                <div className="flex justify-between items-start">
                  <div
                    className={`${
                      urgencyColors[currentCard.urgency as keyof typeof urgencyColors]
                    } text-white px-3 py-1 rounded-full text-xs font-bold`}
                  >
                    {urgencyLabels[currentCard.urgency as keyof typeof urgencyLabels]}
                  </div>
                  <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                    {currentCard.priceInTasklys} Tasklys
                  </div>
                </div>

                {/* Bottom Info */}
                <div className="space-y-3">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {currentCard.title}
                    </h2>
                    <div className="flex items-center gap-2 text-gray-200">
                      <MapPin size={16} />
                      <span>{currentCard.distance} km de distancia</span>
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="flex items-center gap-3 bg-black/40 rounded-lg p-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {currentCard.creatorName?.charAt(0) || "?"}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold text-sm">
                        {currentCard.creatorName || "Prestador"}
                      </p>
                      <div className="flex items-center gap-1">
                        <Star size={12} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-xs text-gray-300">
                          Nivel {currentCard.creatorLevel || 1}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tap to see more */}
                  <div className="flex items-center justify-center gap-1 text-gray-300 text-xs">
                    <ChevronUp size={14} />
                    <span>Toca para más detalles</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Details View */}
            {showDetails && (
              <div className="absolute inset-0 bg-slate-900 p-6 overflow-y-auto flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">
                    {currentCard.title}
                  </h3>
                  <p className="text-gray-300 mb-4 leading-relaxed">
                    {currentCard.description}
                  </p>

                  <div className="space-y-3 bg-slate-800 rounded-lg p-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Categoría</span>
                      <span className="text-white font-semibold capitalize">
                        {currentCard.category}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Precio</span>
                      <span className="text-blue-400 font-bold">
                        {currentCard.priceInTasklys} Tasklys
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Urgencia</span>
                      <span className="text-white font-semibold">
                        {urgencyLabels[currentCard.urgency as keyof typeof urgencyLabels]}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Distancia</span>
                      <span className="text-white font-semibold">
                        {currentCard.distance} km
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 text-sm mt-4 hover:text-white transition"
                >
                  ← Volver
                </button>
              </div>
            )}
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center mt-8">
            <Button
              variant="outline"
              size="lg"
              className="rounded-full w-16 h-16 border-red-500 hover:bg-red-500/10"
              onClick={() => handleSwipe("left")}
            >
              <X size={24} className="text-red-500" />
            </Button>

            <Button
              size="lg"
              className="rounded-full w-16 h-16 bg-blue-600 hover:bg-blue-700"
              onClick={() => handleSwipe("right")}
            >
              <Heart size={24} className="text-white" />
            </Button>
          </div>

          {/* Keyboard Hints */}
          <div className="text-center mt-6 text-sm text-gray-500">
            Desliza para siguiente • Toca la tarjeta para detalles
          </div>
        </div>
      </div>
    </div>
  );
}
