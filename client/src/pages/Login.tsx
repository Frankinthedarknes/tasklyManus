import { useState } from "react";
import { useLocation } from "wouter";
import { LoginForm } from "@/components/LoginForm";

export function Login() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <LoginForm
        onSuccess={() => {
          setLocation("/app/profile");
        }}
        onSignUpClick={() => {
          setLocation("/register");
        }}
        onCancel={() => {
          setLocation("/");
        }}
      />
    </div>
  );
}
