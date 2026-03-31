import { useLocation } from "wouter";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <ForgotPasswordForm
          onSuccess={() => setLocation("/login")}
          onCancel={() => setLocation("/")}
          onBackToLogin={() => setLocation("/login")}
        />
      </div>
    </div>
  );
}
