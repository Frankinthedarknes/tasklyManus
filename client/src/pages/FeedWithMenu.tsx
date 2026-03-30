/**
 * FeedWithMenu Page
 * Main feed page with navigation menu and filters
 */

import React, { useState, useEffect } from "react";
import FeedNavMenu from "@/components/FeedNavMenu";
import FeedTinderCard from "@/pages/FeedTinder";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

interface Service {
  id: number;
  title: string;
  description: string;
  category: string;
  priceInTasklys: number;
  urgency: "now" | "today" | "flexible";
  distance: number;
  imageUrl?: string;
  provider: {
    name: string;
    level: number;
    avatar?: string;
  };
}

export default function FeedWithMenu() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [savedServices, setSavedServices] = useState<Set<number>>(new Set());
  const [filters, setFilters] = useState({
    category: "",
    maxPrice: 1000,
    maxDistance: 50,
    urgency: "",
  });

  // Fetch services with filters
  const { data: services, isLoading, refetch } = trpc.services.getFiltered.useQuery(
    {
      categories: filters.category ? [filters.category] : [],
      priceMax: filters.maxPrice,
      maxDistance: filters.maxDistance,
      urgencies: filters.urgency ? [filters.urgency as any] : [],
      latitude: 40.7128,
      longitude: -74.006,
    },
    { enabled: true }
  );

  // Fetch user's saved services
  const { data: savedData } = trpc.services.getNearby.useQuery({
    latitude: 40.7128,
    longitude: -74.006,
    radiusKm: 50,
  });

  useEffect(() => {
    // Initialize saved services from localStorage
    const saved = localStorage.getItem("savedServices");
    if (saved) {
      setSavedServices(new Set(JSON.parse(saved)));
    }
  }, []);

  const handleLike = (serviceId: number) => {
    // Save service interaction
    setCurrentIndex(currentIndex + 1);
  };

  const handleDislike = (serviceId: number) => {
    setCurrentIndex(currentIndex + 1);
  };

  const handleSave = (serviceId: number) => {
    const newSaved = new Set(savedServices);
    if (newSaved.has(serviceId)) {
      newSaved.delete(serviceId);
    } else {
      newSaved.add(serviceId);
    }
    setSavedServices(newSaved);
    localStorage.setItem("savedServices", JSON.stringify(Array.from(newSaved)));
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    setCurrentIndex(0);
  };

  const handleReset = () => {
    setFilters({
      category: "",
      maxPrice: 1000,
      maxDistance: 50,
      urgency: "",
    });
    setCurrentIndex(0);
    refetch();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!services || services.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950">
        <FeedNavMenu onFilterChange={handleFilterChange} />
        <div className="pt-20 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-slate-400 text-lg mb-4">
              No hay servicios disponibles con estos filtros
            </p>
            <Button onClick={handleReset}>Limpiar Filtros</Button>
          </div>
        </div>
      </div>
    );
  }

  if (currentIndex >= services.length) {
    return (
      <div className="min-h-screen bg-slate-950">
        <FeedNavMenu onFilterChange={handleFilterChange} />
        <div className="pt-20 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-slate-300 text-2xl font-bold mb-2">
              ¡Lo viste todo!
            </p>
            <p className="text-slate-400 mb-6">
              Vuelve más tarde para ver más servicios
            </p>
            <Button onClick={handleReset}>Empezar de Nuevo</Button>
          </div>
        </div>
      </div>
    );
  }

  const currentService = services[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
      {/* Navigation Menu */}
      <FeedNavMenu onFilterChange={handleFilterChange} />

      {/* Main Content */}
      <main className="pt-24 pb-8 px-4">
        <div className="max-w-md mx-auto">
          {/* Active Filters Indicator */}
          {(filters.category || filters.urgency) && (
            <div className="mb-6 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex gap-2 flex-wrap">
                  {filters.category && (
                    <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs">
                      {filters.category}
                    </span>
                  )}
                  {filters.urgency && (
                    <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs">
                      {filters.urgency}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleReset}
                  className="text-blue-400 hover:text-blue-300 text-xs font-medium"
                >
                  Limpiar
                </button>
              </div>
            </div>
          )}

          {/* Feed Card */}
          {currentService && (
            <div className="bg-slate-900 rounded-3xl p-6 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-2">{currentService.title}</h2>
              <p className="text-slate-400 mb-4">{currentService.description}</p>
              <p className="text-blue-400 font-bold text-lg">{currentService.priceInTasklys} Tasklys</p>
              <div className="flex gap-3 mt-6">
                <Button onClick={() => handleDislike(currentService.id)} variant="outline" className="flex-1">
                  Dislike
                </Button>
                <Button onClick={() => handleLike(currentService.id)} className="flex-1">
                  Like
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
