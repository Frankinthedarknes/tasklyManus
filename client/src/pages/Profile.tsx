import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Edit2, LogOut, Zap, TrendingUp, Award } from "lucide-react";
import AppLayout from "./AppLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import BuyTasklysModal from "@/components/BuyTasklysModal";

export default function Profile() {
  const { user, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);

  const { data: profile, isLoading } = trpc.user.getProfile.useQuery();
  const { data: gamification } = trpc.gamification.getProfile.useQuery();
  const { data: wallet } = trpc.wallet.getBalance.useQuery();

  const updateProfile = trpc.user.updateProfile.useMutation();
  const withdrawTasklys = trpc.wallet.withdrawTasklys.useMutation();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="animate-spin w-12 h-12 text-blue-500" />
        </div>
        <BuyTasklysModal
          isOpen={showBuyModal}
          onClose={() => setShowBuyModal(false)}
          onSuccess={() => setShowBuyModal(false)}
        />
      </AppLayout>
    );
  }

  const levelNames = ["Nuevo", "Activo", "Confiable", "Pro", "Leyenda"];
  const levelColors = [
    "from-gray-500 to-gray-600",
    "from-blue-500 to-blue-600",
    "from-purple-500 to-purple-600",
    "from-orange-500 to-orange-600",
    "from-yellow-500 to-yellow-600",
  ];

  const currentLevelIndex = (gamification?.level || 1) - 1;
  const currentLevelColor = levelColors[currentLevelIndex];

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-blue-600 to-cyan-600"></div>
          <div className="px-6 pb-6">
            <div className="flex items-end gap-4 -mt-12 mb-4">
              <div className="w-24 h-24 rounded-lg bg-slate-700 border-4 border-slate-900 flex items-center justify-center text-4xl">
                {profile?.photoUrl ? (
                  <img
                    src={profile.photoUrl || ""}
                    alt={profile?.name || "Profile"}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  "👤"
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white">{profile?.name}</h1>
                <p className="text-slate-400 text-sm">{profile?.email}</p>
              </div>
              <Button
                onClick={() => setEditing(!editing)}
                variant="outline"
                size="sm"
                className="border-slate-600"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Editar
              </Button>
            </div>

            {profile?.bio && (
              <p className="text-slate-300 text-sm">{profile.bio}</p>
            )}
          </div>
        </Card>

        {/* Gamification Section */}
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-400" />
              Nivel y Logros
            </h2>

            <div className="space-y-4">
              {/* Level Display */}
              <div className={`bg-gradient-to-r ${currentLevelColor} rounded-lg p-6 text-white`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm opacity-90">Nivel Actual</p>
                    <p className="text-3xl font-bold">{levelNames[currentLevelIndex]}</p>
                  </div>
                  <div className="text-5xl">
                    {["🌱", "📈", "🛡️", "⭐", "👑"][currentLevelIndex]}
                  </div>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div
                    className="bg-white rounded-full h-2 transition-all"
                    style={{
                      width: `${Math.min(
                        ((gamification?.totalPoints || 0) %
                          [100, 150, 250, 500][currentLevelIndex]) /
                          [100, 150, 250, 500][currentLevelIndex] *
                          100,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                  <p className="text-slate-400 text-xs mb-1">Puntos</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {gamification?.totalPoints || 0}
                  </p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                  <p className="text-slate-400 text-xs mb-1">Racha</p>
                  <p className="text-2xl font-bold text-orange-400">
                    {gamification?.streak || 0}
                  </p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                  <p className="text-slate-400 text-xs mb-1">Servicios</p>
                  <p className="text-2xl font-bold text-green-400">
                    {gamification?.servicesCompleted || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Wallet Section */}
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Cartera
            </h2>

            <div className="space-y-4">
              {/* Balance Display */}
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg p-6 text-white">
                <p className="text-sm opacity-90 mb-1">Saldo en Tasklys</p>
                <p className="text-4xl font-bold">{wallet?.balance || 0}</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <p className="text-slate-400 text-xs mb-1">Total Ganado</p>
                  <p className="text-xl font-bold text-green-400">
                    +{wallet?.totalEarned || 0}
                  </p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <p className="text-slate-400 text-xs mb-1">Total Gastado</p>
                  <p className="text-xl font-bold text-red-400">
                    -{wallet?.totalSpent || 0}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => setShowBuyModal(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Comprar
                </Button>
                <Button
                  onClick={() => {
                    if (wallet && (wallet.balance ?? 0) >= 20) {
                      withdrawTasklys.mutate({ amount: wallet.balance ?? 0 });
                    }
                  }}
                  disabled={
                    !wallet ||
                    (wallet.balance ?? 0) < 20 ||
                    withdrawTasklys.isPending
                  }
                  className="bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-500"
                >
                  {withdrawTasklys.isPending ? (
                    <>Procesando...</>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Retirar
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-slate-400 text-center">
                Mínimo 20 Tasklys para retirar
              </p>
            </div>
          </div>
        </Card>

        {/* Stats Section */}
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Estadísticas</h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <span className="text-slate-300">Calificación Promedio</span>
                <span className="text-yellow-400 font-semibold">
                  ⭐ {(profile?.averageRating || 0).toFixed(1)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <span className="text-slate-300">Total de Reseñas</span>
                <span className="text-blue-400 font-semibold">
                  {profile?.totalRatings || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <span className="text-slate-300">Servicios Completados</span>
                <span className="text-green-400 font-semibold">
                  {profile?.servicesCompleted || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <span className="text-slate-300">Servicios Solicitados</span>
                <span className="text-purple-400 font-semibold">
                  {profile?.servicesRequested || 0}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Logout Button */}
        <Button
          onClick={() => logout()}
          variant="outline"
          className="w-full border-red-600 text-red-400 hover:bg-red-600/10"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar Sesión
        </Button>
      </div>
        <BuyTasklysModal
          isOpen={showBuyModal}
          onClose={() => setShowBuyModal(false)}
          onSuccess={() => setShowBuyModal(false)}
        />
    </AppLayout>
  );
}
