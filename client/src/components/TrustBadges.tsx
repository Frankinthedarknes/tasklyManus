/**
 * TrustBadges Component
 * Displays user trust badges and reputation indicators
 */

import React from "react";
import { trpc } from "@/lib/trpc";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TrustBadgesProps {
  userId: number;
  size?: "sm" | "md" | "lg";
  showLabels?: boolean;
}

const badgeConfig: Record<string, { icon: string; color: string; title: string }> = {
  trusted: {
    icon: "⭐",
    color: "text-blue-400",
    title: "Confiable",
  },
  highly_trusted: {
    icon: "✨",
    color: "text-purple-400",
    title: "Altamente Confiable",
  },
  verified_expert: {
    icon: "🏆",
    color: "text-yellow-400",
    title: "Experto Verificado",
  },
  community_leader: {
    icon: "👑",
    color: "text-amber-400",
    title: "Líder de Comunidad",
  },
  perfect_rating: {
    icon: "💎",
    color: "text-cyan-400",
    title: "Calificación Perfecta",
  },
  responsive: {
    icon: "⚡",
    color: "text-green-400",
    title: "Responde Rápido",
  },
  professional: {
    icon: "💼",
    color: "text-slate-400",
    title: "Profesional",
  },
};

export default function TrustBadges({
  userId,
  size = "md",
  showLabels = false,
}: TrustBadgesProps) {
  const { data: badges, isLoading } = trpc.ratings.getBadges.useQuery({
    userId,
  });

  if (isLoading) {
    return <div className="text-slate-400 text-sm">Cargando insignias...</div>;
  }

  if (!badges || badges.length === 0) {
    return null;
  }

  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  };

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-2 items-center">
        {badges.map((badge: any) => {
          const config = badgeConfig[badge.type as keyof typeof badgeConfig];
          if (!config) return null;

          return (
            <Tooltip key={badge.id}>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 cursor-help">
                  <span className={sizeClasses[size]}>{config.icon}</span>
                  {showLabels && (
                    <span className={`text-sm font-semibold ${config.color}`}>
                      {config.title}
                    </span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-slate-800 border-slate-700">
                <div className="space-y-1">
                  <p className="font-bold text-white">{config.title}</p>
                  <p className="text-xs text-slate-300">{badge.description}</p>
                  <p className="text-xs text-slate-400 mt-2">
                    ⭐ {badge.fiveStarCount} reseñas de 5 estrellas
                  </p>
                  <p className="text-xs text-slate-400">
                    📊 {badge.totalReviews} reseñas totales
                  </p>
                  <p className="text-xs text-slate-400">
                    📈 Promedio: {parseFloat(badge.averageRating).toFixed(2)}/5.0
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
