import { useState } from "react";
import { X, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

interface BuyTasklysModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function BuyTasklysModal({
  isOpen,
  onClose,
  onSuccess,
}: BuyTasklysModalProps) {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [step, setStep] = useState<"select" | "payment" | "success" | "error">(
    "select"
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch available packages
  const { data: packages, isLoading: packagesLoading } =
    trpc.payment.getPackages.useQuery();

  // Create payment intent
  const createIntentMutation = trpc.payment.createPaymentIntent.useMutation();

  // Process payment
  const processPaymentMutation = trpc.payment.processPayment.useMutation();

  // Invalidate user profile to refresh wallet
  const utils = trpc.useUtils();

  const handleSelectPackage = (packageId: string) => {
    setSelectedPackage(packageId);
    setStep("payment");
  };

  const handleProcessPayment = async () => {
    if (!selectedPackage) return;

    try {
      // Create payment intent
      const intent = await createIntentMutation.mutateAsync({
        packageId: selectedPackage,
      });

      // Process payment (simulated)
      const result = await processPaymentMutation.mutateAsync({
        paymentIntentId: intent.id,
      });

      if (result.status === "succeeded") {
        setStep("success");
        const pkg = packages?.find((p) => p.id === selectedPackage);
        const bonus = pkg?.bonus || 0;
        setSuccessMessage(
          `¡Compra exitosa! Recibiste ${pkg?.tasklys}${bonus > 0 ? ` + ${bonus} bonus` : ""} Tasklys`
        );

        // Refresh user profile
        await utils.user.getProfile.invalidate();

        // Call callback
        if (onSuccess) {
          setTimeout(onSuccess, 2000);
        }
      } else {
        setStep("error");
        setErrorMessage(
          result.errorMessage || "Error procesando el pago. Intenta de nuevo."
        );
      }
    } catch (error: any) {
      setStep("error");
      setErrorMessage(
        error.message || "Error procesando el pago. Intenta de nuevo."
      );
    }
  };

  const handleClose = () => {
    setStep("select");
    setSelectedPackage(null);
    setErrorMessage("");
    setSuccessMessage("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-700">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Comprar Tasklys</h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === "select" && (
            <div className="space-y-4">
              {packagesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin w-8 h-8 text-blue-500" />
                </div>
              ) : (
                <>
                  <p className="text-sm text-slate-300 mb-4">
                    Selecciona un paquete de Tasklys:
                  </p>
                  {packages?.map((pkg) => (
                    <button
                      key={pkg.id}
                      onClick={() => handleSelectPackage(pkg.id)}
                      className={`w-full p-4 rounded-lg border-2 transition text-left ${
                        selectedPackage === pkg.id
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-bold text-white">
                            {pkg.tasklys} Tasklys
                          </div>
                          <div className="text-sm text-slate-400">
                            {pkg.description}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-blue-400">
                            ${pkg.priceUSD.toFixed(2)}
                          </div>
                          {pkg.bonus && (
                            <div className="text-xs text-green-400">
                              +{pkg.bonus} bonus
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}

          {step === "payment" && (
            <div className="space-y-4">
              <div className="bg-slate-800 rounded-lg p-4">
                <p className="text-sm text-slate-400 mb-2">Resumen de compra:</p>
                {packages && selectedPackage && (
                  <>
                    {(() => {
                      const pkg = packages.find((p) => p.id === selectedPackage);
                      return (
                        <>
                          <div className="flex justify-between mb-2">
                            <span className="text-white">{pkg?.tasklys} Tasklys</span>
                            <span className="text-blue-400 font-bold">
                              ${pkg?.priceUSD.toFixed(2)}
                            </span>
                          </div>
                          {pkg?.bonus && (
                            <div className="flex justify-between text-green-400 text-sm">
                              <span>Bonus</span>
                              <span>+{pkg.bonus} Tasklys</span>
                            </div>
                          )}
                          <div className="border-t border-slate-700 mt-2 pt-2 flex justify-between">
                            <span className="text-white font-bold">Total:</span>
                            <span className="text-blue-400 font-bold">
                              ${pkg?.priceUSD.toFixed(2)}
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </>
                )}
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <p className="text-xs text-blue-300">
                  💳 Esto es una transacción de prueba. En producción, se
                  procesará con Stripe.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-slate-300">
                  Número de tarjeta
                </label>
                <input
                  type="text"
                  placeholder="4242 4242 4242 4242"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  disabled
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    MM/YY
                  </label>
                  <input
                    type="text"
                    placeholder="12/25"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    CVC
                  </label>
                  <input
                    type="text"
                    placeholder="123"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    disabled
                  />
                </div>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="text-center py-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">
                ¡Pago Exitoso!
              </h3>
              <p className="text-slate-300 mb-4">{successMessage}</p>
              <p className="text-sm text-slate-400">
                Los Tasklys se han agregado a tu wallet.
              </p>
            </div>
          )}

          {step === "error" && (
            <div className="text-center py-6">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Error</h3>
              <p className="text-slate-300 mb-4">{errorMessage}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-slate-700">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1"
            disabled={processPaymentMutation.isPending}
          >
            {step === "success" ? "Cerrar" : "Cancelar"}
          </Button>

          {step === "payment" && (
            <Button
              onClick={handleProcessPayment}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={processPaymentMutation.isPending}
            >
              {processPaymentMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                "Pagar"
              )}
            </Button>
          )}

          {step === "select" && selectedPackage && (
            <Button
              onClick={() => setStep("payment")}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Continuar
            </Button>
          )}

          {(step === "success" || step === "error") && (
            <Button
              onClick={handleClose}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {step === "success" ? "Aceptar" : "Reintentar"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
