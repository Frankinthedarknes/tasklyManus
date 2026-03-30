/**
 * BottomNavBar Component
 * Visible navigation bar at bottom of screen for easy access to all sections
 */

import React from "react";
import { useLocation } from "wouter";
import {
  Home,
  MessageCircle,
  Activity,
  Wallet,
  User,
  Bell,
} from "lucide-react";

interface BottomNavBarProps {
  unreadMessages?: number;
  unreadNotifications?: number;
}

export default function BottomNavBar({
  unreadMessages = 0,
  unreadNotifications = 0,
}: BottomNavBarProps) {
  const [location, navigate] = useLocation();

  const navItems = [
    { icon: Home, label: "Feed", path: "/app/feed", id: "feed" },
    { icon: MessageCircle, label: "Chat", path: "/app/chat", id: "chat", badge: unreadMessages },
    { icon: Activity, label: "Actividad", path: "/app/activity", id: "activity" },
    { icon: Wallet, label: "Wallet", path: "/app/profile", id: "wallet" },
    { icon: User, label: "Perfil", path: "/app/profile", id: "profile" },
  ];

  const isActive = (path: string) => {
    return location.includes(path.split("/")[2]);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center py-3 px-4 relative transition-colors ${
                  active
                    ? "text-blue-500 border-t-2 border-blue-500"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <div className="relative">
                  <Icon className="w-6 h-6" />
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  )}
                </div>
                <span className="text-xs mt-1">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
