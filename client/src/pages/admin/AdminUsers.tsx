import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Ban, CheckCircle } from "lucide-react";
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

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendSeverity, setSuspendSeverity] = useState("temporary");

  const { data: users, isLoading } = trpc.admin.getAllUsers.useQuery({
    limit: 50,
    offset: 0,
  });

  const suspendMutation = trpc.admin.suspendUser.useMutation();
  const unsuspendMutation = trpc.admin.unsuspendUser.useMutation();

  const handleSuspend = async () => {
    if (!selectedUser || !suspendReason) return;

    await suspendMutation.mutateAsync({
      userId: selectedUser.id,
      reason: suspendReason,
      severity: suspendSeverity as any,
    });

    setSuspendReason("");
    setSuspendSeverity("temporary");
    setSelectedUser(null);
  };

  const handleUnsuspend = async (userId: number) => {
    await unsuspendMutation.mutateAsync({ userId });
  };

  const filteredUsers = users?.filter(
    (user: any) =>
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Usuarios</CardTitle>
        <CardDescription>
          Supervisa y gestiona cuentas de usuario
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="mb-6 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Users Table */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr className="text-muted-foreground">
                  <th className="text-left py-3 px-4 font-medium">Usuario</th>
                  <th className="text-left py-3 px-4 font-medium">Email</th>
                  <th className="text-left py-3 px-4 font-medium">Nivel</th>
                  <th className="text-left py-3 px-4 font-medium">Estado</th>
                  <th className="text-left py-3 px-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user: any) => (
                  <tr key={user.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-foreground">{user.name}</div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{user.email}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline">
                        {["Nuevo", "Activo", "Confiable", "Pro", "Leyenda"][
                          (user.level ?? 1) - 1
                        ]}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      {user.idDocumentVerified ? (
                        <Badge className="bg-green-500/10 text-green-600 border-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verificado
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Pendiente</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setSelectedUser(user)}
                            >
                              <Ban className="w-4 h-4 mr-1" />
                              Suspender
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Suspender Usuario</DialogTitle>
                              <DialogDescription>
                                Suspende la cuenta de {selectedUser?.name}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">Severidad</label>
                                <Select value={suspendSeverity} onValueChange={setSuspendSeverity}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="warning">Advertencia</SelectItem>
                                    <SelectItem value="temporary">Temporal (7 días)</SelectItem>
                                    <SelectItem value="permanent">Permanente</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Razón</label>
                                <Textarea
                                  placeholder="Explica por qué se suspende esta cuenta..."
                                  value={suspendReason}
                                  onChange={(e) => setSuspendReason(e.target.value)}
                                />
                              </div>
                              <div className="flex gap-2 justify-end">
                                <Button variant="outline">Cancelar</Button>
                                <Button
                                  onClick={handleSuspend}
                                  disabled={suspendMutation.isPending}
                                >
                                  {suspendMutation.isPending && (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  )}
                                  Suspender
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUnsuspend(user.id)}
                          disabled={unsuspendMutation.isPending}
                        >
                          {unsuspendMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-1" />
                          )}
                          Reactivar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
