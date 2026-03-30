import { useState } from "react";
import { ChevronDown, X, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export interface FilterState {
  categories: string[];
  priceMin: number;
  priceMax: number;
  maxDistance: number;
  urgencies: string[];
}

interface FilterPanelProps {
  onFiltersChange: (filters: FilterState) => void;
  resultsCount?: number;
}

const CATEGORIES = [
  { id: "electricidad", label: "⚡ Electricidad" },
  { id: "plomería", label: "🔧 Plomería" },
  { id: "limpieza", label: "🧹 Limpieza" },
  { id: "diseño", label: "🎨 Diseño" },
  { id: "tecnología", label: "💻 Tecnología" },
  { id: "fitness", label: "💪 Fitness" },
  { id: "educación", label: "📚 Educación" },
  { id: "reparación", label: "🔩 Reparación" },
];

const URGENCIES = [
  { id: "now", label: "Ahora" },
  { id: "today", label: "Hoy" },
  { id: "flexible", label: "Flexible" },
];

export default function FilterPanel({ onFiltersChange, resultsCount = 0 }: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    priceMin: 0,
    priceMax: 1000,
    maxDistance: 50,
    urgencies: [],
  });

  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  const handleCategoryToggle = (categoryId: string) => {
    const updated = filters.categories.includes(categoryId)
      ? filters.categories.filter((c) => c !== categoryId)
      : [...filters.categories, categoryId];

    updateFilters({ ...filters, categories: updated });
  };

  const handleUrgencyToggle = (urgencyId: string) => {
    const updated = filters.urgencies.includes(urgencyId)
      ? filters.urgencies.filter((u) => u !== urgencyId)
      : [...filters.urgencies, urgencyId];

    updateFilters({ ...filters, urgencies: updated });
  };

  const handlePriceMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    updateFilters({ ...filters, priceMin: value });
  };

  const handlePriceMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    updateFilters({ ...filters, priceMax: value });
  };

  const handleDistanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    updateFilters({ ...filters, maxDistance: value });
  };

  const updateFilters = (newFilters: FilterState) => {
    setFilters(newFilters);

    // Count active filters
    let count = 0;
    if (newFilters.categories.length > 0) count++;
    if (newFilters.priceMin > 0 || newFilters.priceMax < 1000) count++;
    if (newFilters.maxDistance < 50) count++;
    if (newFilters.urgencies.length > 0) count++;

    setActiveFiltersCount(count);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    const cleared: FilterState = {
      categories: [],
      priceMin: 0,
      priceMax: 1000,
      maxDistance: 50,
      urgencies: [],
    };
    setFilters(cleared);
    setActiveFiltersCount(0);
    onFiltersChange(cleared);
  };

  return (
    <div className="relative">
      {/* Filter Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative border-blue-500 text-blue-500 hover:bg-blue-500/10"
      >
        <Sliders size={16} className="mr-2" />
        Filtros
        {activeFiltersCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {activeFiltersCount}
          </span>
        )}
      </Button>

      {/* Filter Panel */}
      {isOpen && (
        <Card className="absolute top-full mt-2 right-0 w-80 bg-slate-800 border-slate-700 shadow-2xl z-50">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Filtros Avanzados</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Results Count */}
            {resultsCount > 0 && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-sm text-blue-300">
                {resultsCount} servicios encontrados
              </div>
            )}

            {/* Categories */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Categorías
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {CATEGORIES.map((category) => (
                  <label
                    key={category.id}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(category.id)}
                      onChange={() => handleCategoryToggle(category.id)}
                      className="w-4 h-4 rounded border-gray-500 text-blue-500 cursor-pointer"
                    />
                    <span className="text-sm text-gray-300 group-hover:text-white transition">
                      {category.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Rango de Precio
              </label>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-2">
                    <span>Mínimo</span>
                    <span className="text-blue-400 font-semibold">{filters.priceMin} Tasklys</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    value={filters.priceMin}
                    onChange={handlePriceMinChange}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-2">
                    <span>Máximo</span>
                    <span className="text-blue-400 font-semibold">{filters.priceMax} Tasklys</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    value={filters.priceMax}
                    onChange={handlePriceMaxChange}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Distance */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Distancia Máxima
              </label>
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>Radio de búsqueda</span>
                <span className="text-blue-400 font-semibold">{filters.maxDistance} km</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={filters.maxDistance}
                onChange={handleDistanceChange}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {/* Urgency */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Urgencia
              </label>
              <div className="space-y-2">
                {URGENCIES.map((urgency) => (
                  <label key={urgency.id} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={filters.urgencies.includes(urgency.id)}
                      onChange={() => handleUrgencyToggle(urgency.id)}
                      className="w-4 h-4 rounded border-gray-500 text-blue-500 cursor-pointer"
                    />
                    <span className="text-sm text-gray-300 group-hover:text-white transition">
                      {urgency.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t border-slate-700">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-600/10"
              >
                Limpiar
              </Button>
              <Button
                size="sm"
                onClick={() => setIsOpen(false)}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Aplicar
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
