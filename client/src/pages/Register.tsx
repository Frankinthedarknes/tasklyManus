import { useState } from "react";
import { useLocation } from "wouter";
import { RegistrationForm } from "@/components/RegistrationForm";

export function Register() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <RegistrationForm
        onSuccess={() => {
          setLocation("/app/profile");
        }}
        onCancel={() => {
          setLocation("/");
        }}
      />
    </div>
  );
}
