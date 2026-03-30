import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Loader2, Zap, Home, Plus, MessageCircle, Activity, User } from "lucide-react";
import { ReactNode } from "react";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, loading, logout } = useAuth();
  const [location, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="animate-spin w-12 h-12 text-blue-500" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const navItems = [
    { icon: Home, label: "Feed", path: "/app/feed", id: "feed" },
    { icon: Plus, label: "Publicar", path: "/app/publish", id: "publish" },
    { icon: MessageCircle, label: "Chat", path: "/app/chat", id: "chat" },
    { icon: Activity, label: "Actividad", path: "/app/activity", id: "activity" },
    { icon: User, label: "Perfil", path: "/app/profile", id: "profile" },
  ];

  const currentTab = location.split("/").pop() || "feed";

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Taskly</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-300">
              {user.name || user.email}
            </div>
            <Button
              onClick={() => logout()}
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white"
            >
              Salir
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-700/50 bg-slate-900/95 backdrop-blur-sm md:hidden">
        <div className="flex justify-around">
          {navItems.map(({ icon: Icon, label, path, id }) => (
            <button
              key={id}
              onClick={() => setLocation(path)}
              className={`flex-1 flex flex-col items-center justify-center py-3 px-2 text-xs font-medium transition ${
                currentTab === id
                  ? "text-blue-400 border-t-2 border-blue-500"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              <Icon className="w-6 h-6 mb-1" />
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* Side Navigation (Desktop) */}
      <nav className="hidden md:fixed md:left-0 md:top-16 md:bottom-0 md:w-64 md:border-r md:border-slate-700/50 md:bg-slate-900/50 md:flex md:flex-col md:p-4 md:gap-2">
        {navItems.map(({ icon: Icon, label, path, id }) => (
          <button
            key={id}
            onClick={() => setLocation(path)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              currentTab === id
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Icon className="w-5 h-5" />
            {label}
          </button>
        ))}
      </nav>

      {/* Main content offset for desktop sidebar */}
      <style>{`
        @media (min-width: 768px) {
          main {
            margin-left: 16rem;
          }
        }
      `}</style>
    </div>
  );
}
