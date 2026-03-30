/**
 * ReviewModal Component
 * Mandatory review modal when service is completed
 * User must rate and review before they can take/offer another service
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Star, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ReviewModalProps {
  isOpen: boolean;
  serviceId: number;
  serviceName: string;
  providerName: string;
  onClose: () => void;
  onSubmit: () => void;
  isProvider?: boolean;
}

export default function ReviewModal({
  isOpen,
  serviceId,
  serviceName,
  providerName,
  onClose,
  onSubmit,
  isProvider = false,
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createReviewMutation = trpc.ratings.createRating.useMutation();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Por favor selecciona una calificación");
      return;
    }

    if (comment.trim().length < 10) {
      toast.error("La reseña debe tener al menos 10 caracteres");
      return;
    }

    setIsSubmitting(true);

    try {
      await createReviewMutation.mutateAsync({
        serviceId,
        ratedUserId: 0, // Will be set by backend
        score: rating,
        review: comment,
      });

      toast.success("Reseña enviada exitosamente");
      onSubmit();
      setRating(0);
      setComment("");
    } catch (error) {
      toast.error("Error al enviar la reseña");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Califica el Servicio</h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Service Info */}
        <div className="mb-6 p-4 bg-slate-800 rounded-lg">
          <p className="text-slate-400 text-sm">Servicio</p>
          <p className="text-white font-semibold">{serviceName}</p>
          <p className="text-slate-400 text-sm mt-2">
            {isProvider ? "Cliente" : "Prestador"}
          </p>
          <p className="text-white font-semibold">{providerName}</p>
        </div>

        {/* Rating Section */}
        <div className="mb-6">
          <label className="block text-white font-semibold mb-3">
            ¿Cómo fue tu experiencia?
          </label>
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= (hoverRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-slate-600"
                  }`}
                />
              </button>
            ))}
          </div>
          <p className="text-center text-slate-400 text-sm mt-2">
            {rating === 0
              ? "Selecciona una calificación"
              : `${rating} ${rating === 1 ? "estrella" : "estrellas"}`}
          </p>
        </div>

        {/* Comment Section */}
        <div className="mb-6">
          <label className="block text-white font-semibold mb-2">
            Cuéntanos tu experiencia (mínimo 10 caracteres)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="¿Qué te pareció? ¿Recomendarías este servicio?"
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
            rows={4}
            disabled={isSubmitting}
          />
          <p className="text-slate-400 text-xs mt-1">
            {comment.length}/500 caracteres
          </p>
        </div>

        {/* Info Box */}
        <div className="mb-6 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-blue-300 text-sm">
            <strong>Nota:</strong> No podrás ofrecer ni tomar otro servicio hasta que
            completes esta reseña. Tu opinión es importante para mantener la calidad de
            la plataforma.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1"
            disabled={isSubmitting || rating === 0 || comment.trim().length < 10}
          >
            {isSubmitting ? "Enviando..." : "Enviar Reseña"}
          </Button>
        </div>
      </div>
    </div>
  );
}
