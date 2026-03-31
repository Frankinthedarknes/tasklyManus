import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Upload, Mail, Lock, User, Phone, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { validatePasswordStrength, getPasswordStrengthLabel, getPasswordStrengthColor } from "@shared/passwordValidation";

type RegistrationStep = "form" | "verification" | "photo";

interface RegistrationData {
  email: string;
  password: string;
  name: string;
  phone: string;
  photoUrl?: string;
}

interface RegistrationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function RegistrationForm({ onSuccess, onCancel }: RegistrationFormProps) {
  const [step, setStep] = useState<RegistrationStep>("form");
  const [data, setData] = useState<RegistrationData>({
    email: "",
    password: "",
    name: "",
    phone: "",
  });
  const [verificationCode, setVerificationCode] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    score: 0,
    isValid: false,
    errors: [] as string[],
    suggestions: [] as string[],
  });

  const sendVerificationCode = trpc.auth.sendVerificationCode.useMutation();
  const verifyCode = trpc.auth.verifyCode.useMutation();
  const registerUser = trpc.auth.register.useMutation();

  const handlePasswordChange = (newPassword: string) => {
    setData((prev) => ({ ...prev, password: newPassword }));
    const validation = validatePasswordStrength(newPassword);
    setPasswordValidation(validation);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("La foto no debe superar 10MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor selecciona una imagen válida");
      return;
    }

    setPhotoFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSendCode = async () => {
    if (!data.email || !data.password || !data.name) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    if (data.password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setIsLoading(true);
    try {
      await sendVerificationCode.mutateAsync({ email: data.email });
      toast.success("Código de verificación enviado a tu email");
      setStep("verification");
    } catch (error) {
      toast.error((error as Error).message || "Error al enviar código");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      toast.error("Por favor ingresa el código de verificación");
      return;
    }

    setIsLoading(true);
    try {
      await verifyCode.mutateAsync({
        email: data.email,
        code: verificationCode,
      });
      toast.success("Email verificado correctamente");
      setStep("photo");
    } catch (error) {
      toast.error((error as Error).message || "Código inválido");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = async () => {
    if (photoFile) {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        setData((prev) => ({
          ...prev,
          photoUrl: e.target?.result as string,
        }));
        handleRegister();
      };
      reader.readAsDataURL(photoFile);
    } else {
      handleRegister();
    }
  };

  const handleRegister = async () => {
    setIsLoading(true);
    try {
      await registerUser.mutateAsync({
        email: data.email,
        password: data.password,
        name: data.name,
        phone: data.phone,
        photoUrl: data.photoUrl,
      });
      toast.success("¡Cuenta creada exitosamente!");
      onSuccess?.();
    } catch (error) {
      toast.error((error as Error).message || "Error al crear cuenta");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto p-6 bg-slate-800 border-slate-700">
      {step === "form" && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white mb-6">Crear Cuenta</h2>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              Email
            </label>
            <Input
              type="email"
              name="email"
              value={data.email}
              onChange={handleFormChange}
              placeholder="tu@email.com"
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Nombre Completo
            </label>
            <Input
              type="text"
              name="name"
              value={data.name}
              onChange={handleFormChange}
              placeholder="Tu nombre"
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <Phone className="w-4 h-4 inline mr-2" />
              Teléfono
            </label>
            <Input
              type="tel"
              name="phone"
              value={data.phone}
              onChange={handleFormChange}
              placeholder="+1 (555) 000-0000"
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <Lock className="w-4 h-4 inline mr-2" />
              Contraseña
            </label>
            <Input
              type="password"
              name="password"
              value={data.password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="bg-slate-700 border-slate-600 text-white"
            />
            
            {/* Password Strength Indicator */}
            {data.password && (
              <div className="space-y-2 mt-3">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-medium text-slate-300">Fortaleza</label>
                    <span className="text-xs font-semibold text-slate-400">
                      {getPasswordStrengthLabel(passwordValidation.score)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all ${getPasswordStrengthColor(passwordValidation.score)}`}
                      style={{ width: `${(passwordValidation.score / 5) * 100}%` }}
                    />
                  </div>
                </div>
                
                {passwordValidation.errors.length > 0 && (
                  <div className="space-y-1">
                    {passwordValidation.errors.map((error, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-red-400">
                        <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {passwordValidation.isValid && (
                  <div className="flex items-center gap-2 text-xs text-green-400">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Contraseña válida</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendCode}
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "Enviando..." : "Siguiente"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {step === "verification" && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white mb-6">Verificar Email</h2>
          <p className="text-slate-300 mb-4">
            Hemos enviado un código de verificación a <strong>{data.email}</strong>
          </p>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Código de Verificación
            </label>
            <Input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
              placeholder="Ej: ABC123"
              maxLength={6}
              className="bg-slate-700 border-slate-600 text-white text-center text-2xl tracking-widest"
            />
          </div>

          <p className="text-xs text-slate-400">
            El código expira en 10 minutos
          </p>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setStep("form")}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Atrás
            </Button>
            <Button
              onClick={handleVerifyCode}
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "Verificando..." : "Verificar"}
            </Button>
          </div>
        </div>
      )}

      {step === "photo" && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white mb-6">Foto de Perfil</h2>
          <p className="text-slate-300 mb-4">
            Sube una foto de perfil (opcional)
          </p>

          {photoPreview ? (
            <div className="relative">
              <img
                src={photoPreview}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPhotoFile(null);
                  setPhotoPreview("");
                }}
                className="absolute top-2 right-2"
              >
                Cambiar
              </Button>
            </div>
          ) : (
            <label className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-slate-500 transition">
              <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              <p className="text-slate-300 font-medium">Sube tu foto</p>
              <p className="text-sm text-slate-500">PNG, JPG hasta 10MB</p>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setStep("verification")}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Atrás
            </Button>
            <Button
              onClick={handlePhotoUpload}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "Creando..." : "Crear Cuenta"}
            </Button>
          </div>
        </div>
      )}


    </Card>
  );
}
