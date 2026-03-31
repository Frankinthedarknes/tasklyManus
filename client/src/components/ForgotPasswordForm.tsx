import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { validatePasswordStrength } from "@shared/passwordValidation";

type Step = "email" | "code" | "password" | "success";

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  onBackToLogin?: () => void;
}

export function ForgotPasswordForm({
  onSuccess,
  onCancel,
  onBackToLogin,
}: ForgotPasswordFormProps) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const sendResetCode = trpc.auth.sendPasswordResetCode.useMutation();
  const verifyCode = trpc.auth.verifyResetCode.useMutation();
  const resetPassword = trpc.auth.resetPassword.useMutation();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Por favor ingresa tu email");
      return;
    }

    try {
      await sendResetCode.mutateAsync({ email });
      toast.success("Código de reset enviado a tu email");
      setStep("code");
    } catch (error: any) {
      toast.error(error.message || "Error al enviar el código");
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      toast.error("Por favor ingresa el código");
      return;
    }

    try {
      await verifyCode.mutateAsync({ email, code });
      toast.success("Código verificado");
      setStep("password");
    } catch (error: any) {
      toast.error(error.message || "Código inválido o expirado");
    }
  };

  const handlePasswordChange = (value: string) => {
    setNewPassword(value);
    const strength = validatePasswordStrength(value);
    setPasswordStrength(strength.score);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword.trim()) {
      toast.error("Por favor ingresa una nueva contraseña");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    const validation = validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      toast.error(validation.errors[0] || "Contraseña débil");
      return;
    }

    try {
      await resetPassword.mutateAsync({
        email,
        code,
        newPassword,
      });
      toast.success("Contraseña actualizada exitosamente");
      setStep("success");
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar la contraseña");
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength < 2) return "bg-red-500";
    if (passwordStrength < 3) return "bg-yellow-500";
    if (passwordStrength < 4) return "bg-blue-500";
    return "bg-green-500";
  };

  const getStrengthText = () => {
    if (passwordStrength < 2) return "Débil";
    if (passwordStrength < 3) return "Regular";
    if (passwordStrength < 4) return "Buena";
    return "Excelente";
  };

  return (
    <Card className="w-full max-w-md bg-slate-800 border-slate-700">
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Recuperar Contraseña</h2>
          <p className="text-slate-400 text-sm">
            {step === "email" && "Ingresa tu email para recibir un código de reset"}
            {step === "code" && "Ingresa el código que recibiste por email"}
            {step === "password" && "Crea una nueva contraseña"}
            {step === "success" && "¡Contraseña actualizada!"}
          </p>
        </div>

        {/* Step 1: Email */}
        {step === "email" && (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <Input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <Button
              type="submit"
              disabled={sendResetCode.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {sendResetCode.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar Código"
              )}
            </Button>
          </form>
        )}

        {/* Step 2: Code Verification */}
        {step === "code" && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Código de Reset
              </label>
              <Input
                type="text"
                placeholder="XXXXXX"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="bg-slate-700 border-slate-600 text-white text-center text-lg tracking-widest"
              />
              <p className="text-xs text-slate-400 mt-2">
                Revisa tu email (incluyendo spam)
              </p>
            </div>

            <Button
              type="submit"
              disabled={verifyCode.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {verifyCode.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Verificar Código"
              )}
            </Button>

            <Button
              type="button"
              onClick={() => setStep("email")}
              variant="outline"
              className="w-full border-slate-600"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === "password" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nueva Contraseña
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>

              {newPassword && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-600 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getStrengthColor()} transition-all`}
                        style={{ width: `${(passwordStrength / 4) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400">
                      {getStrengthText()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Mínimo 8 caracteres, mayúscula, minúscula, número y carácter especial
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Confirmar Contraseña
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <Button
              type="submit"
              disabled={resetPassword.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {resetPassword.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Actualizando...
                </>
              ) : (
                "Actualizar Contraseña"
              )}
            </Button>

            <Button
              type="button"
              onClick={() => setStep("code")}
              variant="outline"
              className="w-full border-slate-600"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </form>
        )}

        {/* Step 4: Success */}
        {step === "success" && (
          <div className="space-y-4 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                ¡Éxito!
              </h3>
              <p className="text-slate-400">
                Tu contraseña ha sido actualizada correctamente
              </p>
            </div>
            <Button
              onClick={onBackToLogin}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Volver al Login
            </Button>
          </div>
        )}

        {/* Cancel Button */}
        {step !== "success" && (
          <Button
            type="button"
            onClick={onCancel}
            variant="ghost"
            className="w-full text-slate-400 hover:text-slate-300"
          >
            Cancelar
          </Button>
        )}
      </div>
    </Card>
  );
}
