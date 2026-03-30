import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Upload } from "lucide-react";
import AppLayout from "./AppLayout";
import { toast } from "sonner";

const CATEGORIES = [
  "Mandados",
  "Hogar",
  "Mascotas",
  "Carga y movimiento",
  "Diligencias",
  "Eventos",
  "Tecnología",
  "Compañía y apoyo",
];

export default function Publish() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: CATEGORIES[0],
    priceInTasklys: 10,
    urgency: "flexible" as "now" | "today" | "flexible",
    type: "offer" as "offer" | "request",
    photos: [] as string[],
  });

  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const createService = trpc.services.create.useMutation();

  // Get user location on mount
  useState(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          toast.error("No se pudo obtener tu ubicación");
        }
      );
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!location) {
      toast.error("Por favor activa tu ubicación");
      return;
    }

    if (!formData.title || !formData.description) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    try {
      await createService.mutateAsync({
        ...formData,
        latitude: location.latitude,
        longitude: location.longitude,
        address: "Tu ubicación actual",
      });

      toast.success("Servicio publicado exitosamente");
      setFormData({
        title: "",
        description: "",
        category: CATEGORIES[0],
        priceInTasklys: 10,
        urgency: "flexible",
        type: "offer",
        photos: [],
      });
    } catch (error) {
      toast.error("Error al publicar el servicio");
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Publicar Servicio</h1>

        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Type Selection */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                ¿Qué deseas hacer?
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, type: "offer" })
                  }
                  className={`p-4 rounded-lg border-2 transition ${
                    formData.type === "offer"
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-slate-700 hover:border-slate-600"
                  }`}
                >
                  <p className="text-2xl mb-2">💼</p>
                  <p className="font-semibold text-white">Ofrecer Servicio</p>
                  <p className="text-xs text-slate-400">Yo puedo hacer esto</p>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, type: "request" })
                  }
                  className={`p-4 rounded-lg border-2 transition ${
                    formData.type === "request"
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-slate-700 hover:border-slate-600"
                  }`}
                >
                  <p className="text-2xl mb-2">🆘</p>
                  <p className="font-semibold text-white">Solicitar Servicio</p>
                  <p className="text-xs text-slate-400">Necesito que alguien lo haga</p>
                </button>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Título
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Ej: Ayuda para mover un sofá"
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Cuéntanos más detalles..."
                rows={4}
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Categoría
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Precio en Tasklys: {formData.priceInTasklys}
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={formData.priceInTasklys}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    priceInTasklys: parseInt(e.target.value),
                  })
                }
                className="w-full"
              />
              <p className="text-xs text-slate-400 mt-2">
                Rango: 1 - 100 Tasklys
              </p>
            </div>

            {/* Urgency */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Urgencia
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(["now", "today", "flexible"] as const).map((urg) => (
                  <button
                    key={urg}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, urgency: urg })
                    }
                    className={`p-3 rounded-lg border transition ${
                      formData.urgency === urg
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-slate-700 hover:border-slate-600"
                    }`}
                  >
                    <p className="text-sm font-semibold text-white">
                      {urg === "now"
                        ? "Ahora"
                        : urg === "today"
                          ? "Hoy"
                          : "Flexible"}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Fotos (opcional)
              </label>
              <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-blue-500 transition cursor-pointer">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-400">
                  Arrastra fotos aquí o haz clic para seleccionar
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Máximo 10 fotos
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={createService.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
            >
              {createService.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Publicando...
                </>
              ) : (
                "Publicar Servicio"
              )}
            </Button>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}
