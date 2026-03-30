import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, Users, AlertCircle, FileText, BarChart3 } from "lucide-react";
import AdminUsers from "./admin/AdminUsers";
import AdminDisputes from "./admin/AdminDisputes";
import AdminContent from "./admin/AdminContent";
import AdminAuditLog from "./admin/AdminAuditLog";

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  // Redirect non-admins
  useEffect(() => {
    if (!loading && user?.role !== "admin") {
      navigate("/");
    }
  }, [user, loading, navigate]);

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = trpc.admin.getDashboardStats.useQuery();

  if (loading || statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (user?.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Panel de Administración</h1>
          <p className="text-muted-foreground">Gestiona usuarios, disputas y contenido</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Usuarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stats?.totalUsers || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Disputas Abiertas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                {stats?.activeDisputes || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Contenido Pendiente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">
                {stats?.pendingContent || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Transacciones (24h)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {stats?.recentTransactions?.count || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.recentTransactions?.total || 0} Tasklys
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Usuarios</span>
            </TabsTrigger>
            <TabsTrigger value="disputes" className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Disputas</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Contenido</span>
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Auditoría</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <AdminUsers />
          </TabsContent>

          <TabsContent value="disputes" className="mt-6">
            <AdminDisputes />
          </TabsContent>

          <TabsContent value="content" className="mt-6">
            <AdminContent />
          </TabsContent>

          <TabsContent value="audit" className="mt-6">
            <AdminAuditLog />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
