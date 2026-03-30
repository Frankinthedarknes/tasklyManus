import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Star, Zap } from "lucide-react";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // If authenticated, redirect to main app
  useEffect(() => {
    if (isAuthenticated && user) {
      setLocation("/app/feed");
    }
  }, [isAuthenticated, user, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <Loader2 className="animate-spin w-12 h-12 text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Taskly</span>
          </div>
          <Button
            onClick={() => window.location.href = getLoginUrl()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Ingresar
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
                  ¿Qué hay pa' hacer hoy?
                </h1>
                <p className="text-xl text-slate-300">
                  Conecta con personas cercanas para resolver tareas inmediatas y ganar dinero en el proceso.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => window.location.href = getLoginUrl()}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                >
                  Necesito Ayuda
                </Button>
                <Button
                  onClick={() => window.location.href = getLoginUrl()}
                  size="lg"
                  variant="outline"
                  className="border-slate-600 text-white hover:bg-slate-800"
                >
                  Quiero Ganar Dinero
                </Button>
              </div>

              <p className="text-sm text-slate-400">
                ✓ Sin comisiones ocultas • ✓ Pagos seguros • ✓ Comunidad verificada
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid gap-4">
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-6 hover:border-blue-500/50 transition">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Rápido y Fácil</h3>
                    <p className="text-sm text-slate-400">
                      Encuentra o publica un servicio en segundos
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-6 hover:border-green-500/50 transition">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Geolocalizados</h3>
                    <p className="text-sm text-slate-400">
                      Solo servicios cercanos a tu ubicación
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-6 hover:border-yellow-500/50 transition">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                    <Star className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Confiable</h3>
                    <p className="text-sm text-slate-400">
                      Sistema de reputación y verificación
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-slate-700/50 py-20 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">
            Características Principales
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="text-3xl mb-2">🎴</div>
              <h3 className="text-lg font-semibold text-white">Feed Tipo Swipe</h3>
              <p className="text-slate-400">
                Descubre servicios cercanos deslizando tarjetas, como en apps de citas pero para tareas.
              </p>
            </div>

            <div className="space-y-3">
              <div className="text-3xl mb-2">💰</div>
              <h3 className="text-lg font-semibold text-white">Tasklys - Tokens Internos</h3>
              <p className="text-slate-400">
                Compra paquetes de Tasklys y úsalos para pagar servicios de forma segura.
              </p>
            </div>

            <div className="space-y-3">
              <div className="text-3xl mb-2">🏆</div>
              <h3 className="text-lg font-semibold text-white">Gamificación</h3>
              <p className="text-slate-400">
                Sube de nivel (Nuevo → Leyenda), gana logros y desbloqueabeneficiosexclusivos.
              </p>
            </div>

            <div className="space-y-3">
              <div className="text-3xl mb-2">💬</div>
              <h3 className="text-lg font-semibold text-white">Chat Seguro</h3>
              <p className="text-slate-400">
                Comunícate dentro de la plataforma sin compartir datos personales.
              </p>
            </div>

            <div className="space-y-3">
              <div className="text-3xl mb-2">🛡️</div>
              <h3 className="text-lg font-semibold text-white">Pagos en Escrow</h3>
              <p className="text-slate-400">
                Los Tasklys se liberan solo después de confirmar que el servicio se completó.
              </p>
            </div>

            <div className="space-y-3">
              <div className="text-3xl mb-2">⭐</div>
              <h3 className="text-lg font-semibold text-white">Calificaciones</h3>
              <p className="text-slate-400">
                Sistema bidireccional de reseñas para construir confianza en la comunidad.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">
            Paquetes de Tasklys
          </h2>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { amount: 5, price: "$2", best: false },
              { amount: 20, price: "$7", best: true },
              { amount: 50, price: "$15", best: false },
              { amount: 100, price: "$25", best: false },
            ].map((pkg) => (
              <div
                key={pkg.amount}
                className={`relative rounded-lg border p-6 transition ${
                  pkg.best
                    ? "border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/50"
                    : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                }`}
              >
                {pkg.best && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    Más Popular
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <p className="text-3xl font-bold text-white">{pkg.amount}</p>
                    <p className="text-sm text-slate-400">Tasklys</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{pkg.price}</p>
                    <p className="text-xs text-slate-400">USD</p>
                  </div>
                  <Button
                    onClick={() => window.location.href = getLoginUrl()}
                    className={
                      pkg.best
                        ? "w-full bg-blue-600 hover:bg-blue-700"
                        : "w-full bg-slate-700 hover:bg-slate-600"
                    }
                  >
                    Comprar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-slate-700/50 py-20 bg-gradient-to-r from-blue-600/20 to-cyan-600/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            ¿Listo para empezar?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Únete a miles de usuarios ganando dinero con tareas simples.
          </p>
          <Button
            onClick={() => window.location.href = getLoginUrl()}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8"
          >
            Crear Cuenta Gratis
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 bg-slate-900/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-white">Taskly</span>
            </div>
            <p className="text-sm text-slate-400">
              © 2026 Taskly. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
