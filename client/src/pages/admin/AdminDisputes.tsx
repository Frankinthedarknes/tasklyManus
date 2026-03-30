import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusColors: Record<string, string> = {
  open: "bg-blue-500/10 text-blue-600 border-blue-200",
  in_review: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
  mediation: "bg-purple-500/10 text-purple-600 border-purple-200",
  resolved: "bg-green-500/10 text-green-600 border-green-200",
  closed: "bg-gray-500/10 text-gray-600 border-gray-200",
};

export default function AdminDisputes() {
  const [filterStatus, setFilterStatus] = useState("open");
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [resolution, setResolution] = useState("");
  const [resolutionType, setResolutionType] = useState("refund");

  const { data: disputes, isLoading, refetch } = trpc.admin.getDisputes.useQuery({
    status: filterStatus,
    limit: 50,
    offset: 0,
  });

  const assignMutation = trpc.admin.assignDispute.useMutation();
  const resolveMutation = trpc.admin.resolveDispute.useMutation();

  const handleAssign = async (disputeId: number) => {
    await assignMutation.mutateAsync({ disputeId });
    refetch();
  };

  const handleResolve = async () => {
    if (!selectedDispute || !resolution) return;

    await resolveMutation.mutateAsync({
      disputeId: selectedDispute.id,
      resolution,
      resolutionType: resolutionType as any,
    });

    setResolution("");
    setResolutionType("refund");
    setSelectedDispute(null);
    refetch();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Disputas</CardTitle>
        <CardDescription>
          Revisa y resuelve conflictos entre usuarios
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filter */}
        <div className="mb-6">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Abiertas</SelectItem>
              <SelectItem value="in_review">En Revisión</SelectItem>
              <SelectItem value="mediation">Mediación</SelectItem>
              <SelectItem value="resolved">Resueltas</SelectItem>
              <SelectItem value="closed">Cerradas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Disputes List */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : disputes && disputes.length > 0 ? (
          <div className="space-y-4">
            {disputes.map((dispute: any) => (
              <div
                key={dispute.id}
                className="border border-border rounded-lg p-4 hover:bg-muted/50 transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{dispute.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{dispute.description}</p>
                  </div>
                  <Badge className={statusColors[dispute.status] || ""}>
                    {dispute.status.replace("_", " ").toUpperCase()}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Reportador:</span>
                    <p className="font-medium text-foreground">Usuario #{dispute.reporterId}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Demandado:</span>
                    <p className="font-medium text-foreground">Usuario #{dispute.respondentId}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Categoría:</span>
                    <p className="font-medium text-foreground">
                      {dispute.category.replace("_", " ")}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Creado:</span>
                    <p className="font-medium text-foreground">
                      {new Date(dispute.createdAt).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {dispute.status === "open" && (
                    <Button
                      size="sm"
                      onClick={() => handleAssign(dispute.id)}
                      disabled={assignMutation.isPending}
                    >
                      {assignMutation.isPending && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      Asignarme
                    </Button>
                  )}

                  {dispute.status === "in_review" && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          onClick={() => setSelectedDispute(dispute)}
                          variant="default"
                        >
                          Resolver
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Resolver Disputa</DialogTitle>
                          <DialogDescription>
                            {selectedDispute?.title}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Tipo de Resolución</label>
                            <Select value={resolutionType} onValueChange={setResolutionType}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="refund">Reembolso Completo</SelectItem>
                                <SelectItem value="partial_refund">Reembolso Parcial</SelectItem>
                                <SelectItem value="no_refund">Sin Reembolso</SelectItem>
                                <SelectItem value="service_completion">Completar Servicio</SelectItem>
                                <SelectItem value="other">Otro</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Resolución</label>
                            <Textarea
                              placeholder="Explica la decisión y por qué..."
                              value={resolution}
                              onChange={(e) => setResolution(e.target.value)}
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline">Cancelar</Button>
                            <Button
                              onClick={handleResolve}
                              disabled={resolveMutation.isPending}
                            >
                              {resolveMutation.isPending && (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              )}
                              Resolver
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No hay disputas en este estado</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
