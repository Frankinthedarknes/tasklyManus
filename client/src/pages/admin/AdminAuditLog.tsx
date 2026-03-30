import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

const actionColors: Record<string, string> = {
  suspend_user: "bg-red-500/10 text-red-600 border-red-200",
  unsuspend_user: "bg-green-500/10 text-green-600 border-green-200",
  assign_dispute: "bg-blue-500/10 text-blue-600 border-blue-200",
  resolve_dispute: "bg-purple-500/10 text-purple-600 border-purple-200",
  verify_payment: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  assign_admin_role: "bg-orange-500/10 text-orange-600 border-orange-200",
};

export default function AdminAuditLog() {
  const { data: logs, isLoading } = trpc.admin.getAuditLogs.useQuery({
    limit: 100,
    offset: 0,
  });

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      suspend_user: "Suspender Usuario",
      unsuspend_user: "Reactivar Usuario",
      assign_dispute: "Asignar Disputa",
      resolve_dispute: "Resolver Disputa",
      verify_payment: "Verificar Pago",
      assign_admin_role: "Asignar Rol Admin",
      review_content_approved: "Aprobar Contenido",
      review_content_rejected: "Rechazar Contenido",
      review_content_removed: "Eliminar Contenido",
    };
    return labels[action] || action.replace("_", " ");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registro de Auditoría</CardTitle>
        <CardDescription>
          Historial de acciones realizadas por administradores
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : logs && logs.length > 0 ? (
          <div className="space-y-3">
            {logs.map((log: any) => (
              <div
                key={log.id}
                className="border border-border rounded-lg p-4 hover:bg-muted/50 transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        className={actionColors[log.action] || ""}
                        variant="outline"
                      >
                        {getActionLabel(log.action)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {log.entityType} #{log.entityId}
                      </span>
                    </div>

                    {log.reason && (
                      <p className="text-sm text-muted-foreground mb-2">
                        Razón: {log.reason}
                      </p>
                    )}

                    {log.changes && (
                      <div className="text-xs text-muted-foreground bg-muted p-2 rounded mb-2">
                        <details className="cursor-pointer">
                          <summary className="font-medium">Ver cambios</summary>
                          <pre className="mt-2 overflow-auto max-h-32">
                            {JSON.stringify(log.changes, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleDateString("es-ES")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleTimeString("es-ES")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No hay registros de auditoría</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
