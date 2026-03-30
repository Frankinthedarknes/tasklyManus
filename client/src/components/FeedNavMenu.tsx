/**
 * FeedNavMenu Component
 * Hamburger menu with navigation, filters, and quick actions
 */

import React, { useState } from "react";
import {
  Menu,
  X,
  Home,
  MessageCircle,
  Activity,
  Wallet,
  Settings,
  LogOut,
  Bell,
  Search,
  Filter,
  Heart,
  User,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

interface FeedNavMenuProps {
  onFilterChange?: (filters: any) => void;
  unreadMessages?: number;
  unreadNotifications?: number;
}

export default function FeedNavMenu({
  onFilterChange,
  unreadMessages = 0,
  unreadNotifications = 0,
}: FeedNavMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  const [filters, setFilters] = useState({
    category: "",
    maxPrice: 1000,
    maxDistance: 50,
    urgency: "",
  });

  const menuItems = [
    { icon: Home, label: "Feed", path: "/app/feed" },
    { icon: MessageCircle, label: "Chat", path: "/app/chat", badge: unreadMessages },
    { icon: Activity, label: "Actividad", path: "/app/activity" },
    { icon: Wallet, label: "Wallet", path: "/app/profile" },
    { icon: User, label: "Perfil", path: "/app/profile" },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  return (
    <>
      {/* Header with Menu Button */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
              T
            </div>
            <span className="text-xl font-bold text-white hidden sm:inline">
              Taskly
            </span>
          </div>

          {/* Center - Quick Search */}
          <div className="hidden md:flex flex-1 max-w-xs mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar servicios..."
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Right - Notifications & Menu */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="relative p-2 hover:bg-slate-800 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-slate-400 hover:text-white" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>

            {/* Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              {isOpen ? (
                <X className="w-5 h-5 text-white" />
              ) : (
                <Menu className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar Menu */}
      <div
        className={`fixed left-0 top-16 bottom-0 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 z-30 overflow-y-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 space-y-6">
          {/* User Profile Section */}
          {user && (
            <div className="pb-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white">
                  {user.name?.charAt(0) || "U"}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{user.name}</p>
                  <p className="text-slate-400 text-xs">{user.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigate(item.path)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors relative group"
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Filters Section */}
          <div className="pt-6 border-t border-slate-800">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            >
              <Filter className="w-5 h-5" />
              <span>Filtros</span>
            </button>

            {showFilters && (
              <div className="mt-4 space-y-4 px-4 py-4 bg-slate-800 rounded-lg">
                {/* Category Filter */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase">
                    Categoría
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) =>
                      handleFilterChange("category", e.target.value)
                    }
                    className="w-full mt-2 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Todas</option>
                    <option value="design">Diseño</option>
                    <option value="fitness">Fitness</option>
                    <option value="cleaning">Limpieza</option>
                    <option value="repair">Reparación</option>
                    <option value="tutoring">Tutoría</option>
                    <option value="cooking">Cocina</option>
                  </select>
                </div>

                {/* Price Filter */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase">
                    Precio máximo: {filters.maxPrice} Tasklys
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    value={filters.maxPrice}
                    onChange={(e) =>
                      handleFilterChange("maxPrice", parseInt(e.target.value))
                    }
                    className="w-full mt-2"
                  />
                </div>

                {/* Distance Filter */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase">
                    Distancia máxima: {filters.maxDistance} km
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={filters.maxDistance}
                    onChange={(e) =>
                      handleFilterChange("maxDistance", parseInt(e.target.value))
                    }
                    className="w-full mt-2"
                  />
                </div>

                {/* Urgency Filter */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase">
                    Urgencia
                  </label>
                  <select
                    value={filters.urgency}
                    onChange={(e) =>
                      handleFilterChange("urgency", e.target.value)
                    }
                    className="w-full mt-2 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Todas</option>
                    <option value="now">Ahora</option>
                    <option value="today">Hoy</option>
                    <option value="flexible">Flexible</option>
                  </select>
                </div>

                <Button
                  onClick={() => setShowFilters(false)}
                  className="w-full"
                  size="sm"
                >
                  Aplicar Filtros
                </Button>
              </div>
            )}
          </div>

          {/* Saved Services */}
          <div className="pt-6 border-t border-slate-800">
            <button
              onClick={() => handleNavigate("/app/activity")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            >
              <Heart className="w-5 h-5" />
              <span>Servicios Guardados</span>
            </button>
          </div>

          {/* Settings & Logout */}
          <div className="pt-6 border-t border-slate-800 space-y-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors">
              <Settings className="w-5 h-5" />
              <span>Configuración</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 top-16"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
