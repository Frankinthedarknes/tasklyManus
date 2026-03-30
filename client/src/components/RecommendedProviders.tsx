/**
 * RecommendedProviders Component
 * Displays recommended high-quality providers based on service category
 */

import React from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Star, Award, ChevronRight } from "lucide-react";
import TrustBadges from "./TrustBadges";

interface RecommendedProvidersProps {
  category: string;
  limit?: number;
  onProviderSelect?: (providerId: number) => void;
}

export default function RecommendedProviders({
  category,
  limit = 5,
  onProviderSelect,
}: RecommendedProvidersProps) {
  const { data: providers, isLoading } = trpc.recommendations.getTopProviders.useQuery({
    category,
    limit,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="animate-spin w-6 h-6 text-blue-500" />
      </div>
    );
  }

  if (!providers || providers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-5 h-5 text-yellow-500" />
        <h3 className="text-lg font-semibold text-white">Proveedores Recomendados</h3>
      </div>

      <div className="space-y-3">
        {providers.map((provider: any) => (
          <Card
            key={provider.userId}
            className="bg-slate-800 border-slate-700 p-4 hover:border-blue-500 transition-colors cursor-pointer"
            onClick={() => onProviderSelect?.(provider.userId)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-lg flex-shrink-0">
                    {provider.photoUrl ? (
                      <img
                        src={provider.photoUrl}
                        alt={provider.userName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      "👤"
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-white truncate">
                      {provider.userName}
                    </h4>
                    <p className="text-xs text-slate-400">
                      Nivel {provider.userLevel}
                    </p>
                  </div>
                </div>

                {/* Badges */}
                {provider.badges && provider.badges.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1">
                    {provider.badges.slice(0, 3).map((badge: any, idx: number) => (
                      <span
                        key={idx}
                        className="text-sm"
                        title={badge.title}
                      >
                        {badge.icon}
                      </span>
                    ))}
                    {provider.badges.length > 3 && (
                      <span className="text-xs text-slate-400">
                        +{provider.badges.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-semibold">
                      {parseFloat(provider.averageRating).toFixed(1)}
                    </span>
                  </div>
                  <span className="text-slate-400">
                    {provider.totalRatings} reseñas
                  </span>
                  {provider.servicesCount && (
                    <span className="text-slate-400">
                      {provider.servicesCount} servicios
                    </span>
                  )}
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-slate-500 flex-shrink-0 mt-1" />
            </div>
          </Card>
        ))}
      </div>

      {providers.length > 0 && (
        <Button
          variant="outline"
          className="w-full border-slate-600 text-slate-300 hover:bg-slate-800"
        >
          Ver todos los proveedores destacados
        </Button>
      )}
    </div>
  );
}
