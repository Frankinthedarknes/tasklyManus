import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const contentTypeLabels: Record<string, string> = {
  service_description: "Descripción de Servicio",
  chat_message: "Mensaje de Chat",
  profile_bio: "Bio de Perfil",
  rating_review: "Reseña",
  photo: "Foto",
};

export default function AdminContent() {
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const { data: content, isLoading, refetch } = trpc.admin.getPendingContent.useQuery({
    limit: 50,
    offset: 0,
  });

  const reviewMutation = trpc.admin.reviewContent.useMutation();

  const handleReview = async (status: "approved" | "rejected" | "removed") => {
    if (!selectedContent) return;

    await reviewMutation.mutateAsync({
      moderationId: selectedContent.id,
      status,
      adminNotes,
    });

    setAdminNotes("");
    setSelectedContent(null);
    refetch();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Moderación de Contenido</CardTitle>
        <CardDescription>
          Revisa y aprueba contenido reportado
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : content && content.length > 0 ? (
          <div className="space-y-4">
            {content.map((item: any) => (
              <div
                key={item.id}
                className="border border-border rounded-lg p-4 hover:bg-muted/50 transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">
                        {contentTypeLabels[item.contentType] || item.contentType}
                      </Badge>
                      <Badge variant="secondary">{item.reason}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Usuario:</span>
                    <p className="font-medium text-foreground">#{item.userId}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Reportado por:</span>
                    <p className="font-medium text-foreground">
                      {item.reportedBy ? `#${item.reportedBy}` : "Sistema"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fecha:</span>
                    <p className="font-medium text-foreground">
                      {new Date(item.createdAt).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Estado:</span>
                    <p className="font-medium text-foreground capitalize">{item.status}</p>
                  </div>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      onClick={() => setSelectedContent(item)}
                      variant="outline"
                    >
                      Revisar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Revisar Contenido</DialogTitle>
                      <DialogDescription>
                        {contentTypeLabels[selectedContent?.contentType]}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-2">Contenido:</p>
                        <p className="text-foreground">{selectedContent?.description}</p>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Notas del Admin</label>
                        <Textarea
                          placeholder="Añade notas sobre tu decisión..."
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                        />
                      </div>

                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          onClick={() => handleReview("approved")}
                          disabled={reviewMutation.isPending}
                        >
                          <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                          Aprobar
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleReview("rejected")}
                          disabled={reviewMutation.isPending}
                        >
                          <XCircle className="w-4 h-4 mr-2 text-yellow-600" />
                          Rechazar
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleReview("removed")}
                          disabled={reviewMutation.isPending}
                        >
                          {reviewMutation.isPending && (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          )}
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No hay contenido pendiente de revisión</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
