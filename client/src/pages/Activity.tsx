import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Loader2, Heart, Clock, CheckCircle, MapPin } from "lucide-react";
import AppLayout from "./AppLayout";

interface SavedService {
  id: number;
  serviceId: number;
  createdAt: Date;
}

export default function Activity() {
  const [activeTab, setActiveTab] = useState<"saved" | "history">("saved");
  const [savedServices, setSavedServices] = useState<SavedService[]>([]);

  const { data: saved, isLoading } = trpc.services.getSaved.useQuery();

  useEffect(() => {
    if (saved) {
      setSavedServices(saved as SavedService[]);
    }
  }, [saved]);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Actividad</h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-slate-700">
          <button
            onClick={() => setActiveTab("saved")}
            className={`px-4 py-2 font-semibold transition border-b-2 ${
              activeTab === "saved"
                ? "text-blue-400 border-blue-500"
                : "text-slate-400 border-transparent hover:text-slate-300"
            }`}
          >
            <Heart className="w-4 h-4 inline mr-2" />
            Guardados ({savedServices.length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 font-semibold transition border-b-2 ${
              activeTab === "history"
                ? "text-blue-400 border-blue-500"
                : "text-slate-400 border-transparent hover:text-slate-300"
            }`}
          >
            <Clock className="w-4 h-4 inline mr-2" />
            Historial
          </button>
        </div>

        {/* Saved Services */}
        {activeTab === "saved" && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="animate-spin w-8 h-8 text-blue-500" />
              </div>
            ) : savedServices.length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700 p-12 text-center">
                <Heart className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">
                  Aún no has guardado ningún servicio
                </p>
                <p className="text-sm text-slate-500 mt-2">
                  Desliza en el feed y guarda los servicios que te interesen
                </p>
              </Card>
            ) : (
              savedServices.map((item) => (
                <Card
                  key={item.id}
                  className="bg-gradient-to-r from-slate-800 to-slate-900 border-slate-700 p-4 hover:border-slate-600 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                          💼
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">
                            Servicio #{item.serviceId}
                          </h3>
                          <p className="text-xs text-slate-400">
                            Guardado hace{" "}
                            {Math.floor(
                              (Date.now() - new Date(item.createdAt).getTime()) /
                                60000
                            )}{" "}
                            minutos
                          </p>
                        </div>
                      </div>
                    </div>
                    <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* History */}
        {activeTab === "history" && (
          <div className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">
                    Servicio Completado
                  </h3>
                  <p className="text-sm text-slate-400 mb-2">
                    Ayuda para mover un sofá
                  </p>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>Hace 2 días</span>
                    <span>•</span>
                    <span className="text-green-400">+15 Tasklys</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">
                    Servicio Solicitado
                  </h3>
                  <p className="text-sm text-slate-400 mb-2">
                    Necesito ayuda para limpiar mi apartamento
                  </p>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>Hace 1 semana</span>
                    <span>•</span>
                    <span className="text-blue-400">-20 Tasklys</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-yellow-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">
                    En Progreso
                  </h3>
                  <p className="text-sm text-slate-400 mb-2">
                    Acompañamiento a trámite
                  </p>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>Comenzó hace 3 horas</span>
                    <span>•</span>
                    <span className="text-yellow-400">Esperando confirmación</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
