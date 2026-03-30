import { useState, useMemo } from "react";
import React from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Loader2,
  Download,
  Search,
  Filter,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import AppLayout from "./AppLayout";

export default function TransactionHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "failed">("all");
  const [dateFilter, setDateFilter] = useState<"all" | "week" | "month" | "year">("all");
  const [showFilters, setShowFilters] = useState(false);

  // Fetch user receipts
  const { data: receipts, isLoading } = trpc.payment.getUserReceipts.useQuery();

  // Fetch receipt content for download
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);
  const { data: receiptContent, isLoading: contentLoading } =
    trpc.payment.getReceiptContent.useQuery(
      { receiptId: selectedReceiptId || "" },
      { enabled: !!selectedReceiptId }
    );

  // Filter and search logic
  const filteredReceipts = useMemo(() => {
    if (!receipts) return [];

    let filtered = [...receipts];

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();

      if (dateFilter === "week") {
        filterDate.setDate(now.getDate() - 7);
      } else if (dateFilter === "month") {
        filterDate.setMonth(now.getMonth() - 1);
      } else if (dateFilter === "year") {
        filterDate.setFullYear(now.getFullYear() - 1);
      }

      filtered = filtered.filter((r) => new Date(r.createdAt) >= filterDate);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.invoiceNumber.toLowerCase().includes(term) ||
          r.transactionId.toLowerCase().includes(term) ||
          r.tasklysAmount.toString().includes(term)
      );
    }

    // Sort by date descending
    return filtered.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [receipts, statusFilter, dateFilter, searchTerm]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!receipts) return { totalSpent: 0, totalTasklys: 0, totalTransactions: 0 };

    const completed = receipts.filter((r) => r.status === "completed");
    return {
      totalSpent: completed.reduce((sum, r) => sum + r.priceUSD, 0),
      totalTasklys: completed.reduce((sum, r) => sum + r.tasklysAmount, 0),
      totalTransactions: completed.length,
    };
  }, [receipts]);

  const handleDownloadReceipt = (receiptId: string, invoiceNumber: string) => {
    setSelectedReceiptId(receiptId);
    // Download will happen when receiptContent is loaded
  };

  // Auto-download when receipt content is loaded
  React.useEffect(() => {
    if (receiptContent && selectedReceiptId) {
      const element = document.createElement("a");
      const file = new Blob([receiptContent], { type: "text/plain" });
      element.href = URL.createObjectURL(file);
      // Find invoice number from receipts
      const receipt = receipts?.find((r) => r.id === selectedReceiptId);
      element.download = `${receipt?.invoiceNumber || "recibo"}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      setSelectedReceiptId(null);
    }
  }, [receiptContent, selectedReceiptId, receipts]);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Historial de Compras</h1>
          <p className="text-slate-400">Visualiza todas tus compras de Tasklys</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-400 text-sm">Total Gastado</p>
                <DollarSign className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-3xl font-bold text-white">
                ${stats.totalSpent.toFixed(2)}
              </p>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-400 text-sm">Total Tasklys</p>
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-3xl font-bold text-white">{stats.totalTasklys}</p>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-400 text-sm">Transacciones</p>
                <CheckCircle className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-3xl font-bold text-white">{stats.totalTransactions}</p>
            </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="bg-slate-800 border-slate-700">
          <div className="p-6 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por número de factura, ID de transacción o monto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
            </button>

            {/* Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-700">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Estado</label>
                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value as "all" | "completed" | "failed")
                    }
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">Todos</option>
                    <option value="completed">Completadas</option>
                    <option value="failed">Fallidas</option>
                  </select>
                </div>

                {/* Date Filter */}
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Período</label>
                  <select
                    value={dateFilter}
                    onChange={(e) =>
                      setDateFilter(e.target.value as "all" | "week" | "month" | "year")
                    }
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">Todo el tiempo</option>
                    <option value="week">Última semana</option>
                    <option value="month">Último mes</option>
                    <option value="year">Último año</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Transactions List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : filteredReceipts.length === 0 ? (
            <Card className="bg-slate-800 border-slate-700">
              <div className="p-12 text-center">
                <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-300 text-lg">No hay transacciones</p>
                <p className="text-slate-400 text-sm mt-2">
                  {searchTerm || statusFilter !== "all" || dateFilter !== "all"
                    ? "No se encontraron transacciones con los filtros aplicados"
                    : "Aún no has realizado ninguna compra"}
                </p>
              </div>
            </Card>
          ) : (
            filteredReceipts.map((receipt) => (
              <Card
                key={receipt.id}
                className="bg-slate-800 border-slate-700 hover:border-slate-600 transition"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          {receipt.invoiceNumber}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            receipt.status === "completed"
                              ? "bg-green-500/20 text-green-400"
                              : receipt.status === "failed"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {receipt.status === "completed"
                            ? "✓ Completada"
                            : receipt.status === "failed"
                              ? "✗ Fallida"
                              : "⏳ Pendiente"}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400">
                        {new Date(receipt.createdAt).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-400">
                        {receipt.tasklysAmount}
                      </p>
                      <p className="text-sm text-slate-400">Tasklys</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 pb-4 border-b border-slate-700">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">ID Transacción</p>
                      <p className="text-sm text-white font-mono">
                        {receipt.transactionId.substring(0, 12)}...
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Monto USD</p>
                      <p className="text-sm text-white">${receipt.priceUSD.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Método de Pago</p>
                      <p className="text-sm text-white capitalize">
                        {receipt.paymentMethod.replace("_", " ")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Tasa</p>
                      <p className="text-sm text-white">
                        {(receipt.tasklysAmount / receipt.priceUSD).toFixed(2)}/USD
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() =>
                        handleDownloadReceipt(receipt.id, receipt.invoiceNumber)
                      }
                      disabled={contentLoading && selectedReceiptId === receipt.id}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      size="sm"
                    >
                      {contentLoading && selectedReceiptId === receipt.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Descargando...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Descargar Recibo
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
