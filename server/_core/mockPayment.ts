/**
 * Mock Payment Service for Taskly
 * Simulates payment processing without requiring Stripe
 * Can be easily replaced with real Stripe integration later
 */

export interface PaymentPackage {
  id: string;
  tasklys: number;
  priceUSD: number;
  description: string;
  bonus?: number;
}

export interface PaymentIntent {
  id: string;
  userId: number;
  packageId: string;
  amount: number;
  currency: string;
  status: "pending" | "processing" | "succeeded" | "failed";
  createdAt: Date;
  completedAt?: Date;
  errorMessage?: string;
}

export interface PaymentReceipt {
  id: string;
  transactionId: string;
  userId: number;
  tasklysAmount: number;
  priceUSD: number;
  paymentMethod: string;
  status: "completed" | "failed" | "refunded";
  createdAt: Date;
  invoiceNumber: string;
}

// Available Taskly packages
export const TASKLY_PACKAGES: PaymentPackage[] = [
  {
    id: "pkg_5",
    tasklys: 5,
    priceUSD: 2.0,
    description: "5 Tasklys - Perfecto para empezar",
  },
  {
    id: "pkg_20",
    tasklys: 20,
    priceUSD: 7.0,
    description: "20 Tasklys - Mejor valor",
    bonus: 2,
  },
  {
    id: "pkg_50",
    tasklys: 50,
    priceUSD: 15.0,
    description: "50 Tasklys - Gran ahorro",
    bonus: 5,
  },
  {
    id: "pkg_100",
    tasklys: 100,
    priceUSD: 25.0,
    description: "100 Tasklys - Máximo valor",
    bonus: 10,
  },
];

// In-memory storage for demo purposes (in production, use database)
const paymentIntents = new Map<string, PaymentIntent>();
const paymentReceipts: PaymentReceipt[] = [];

/**
 * Generate unique transaction ID
 */
function generateTransactionId(): string {
  return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate invoice number
 */
function generateInvoiceNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `INV-${year}${month}-${random}`;
}

/**
 * Create a payment intent (simulates Stripe Payment Intent)
 */
export function createPaymentIntent(
  userId: number,
  packageId: string
): PaymentIntent {
  const pkg = TASKLY_PACKAGES.find((p) => p.id === packageId);
  if (!pkg) {
    throw new Error(`Invalid package ID: ${packageId}`);
  }

  const intent: PaymentIntent = {
    id: generateTransactionId(),
    userId,
    packageId,
    amount: pkg.priceUSD,
    currency: "USD",
    status: "pending",
    createdAt: new Date(),
  };

  paymentIntents.set(intent.id, intent);
  return intent;
}

/**
 * Process payment (simulates payment processing)
 * In production, this would call Stripe API
 */
export function processPayment(
  paymentIntentId: string,
  cardToken?: string
): PaymentIntent {
  const intent = paymentIntents.get(paymentIntentId);
  if (!intent) {
    throw new Error(`Payment intent not found: ${paymentIntentId}`);
  }

  // Simulate payment processing
  intent.status = "processing";

  // Simulate random success/failure (90% success rate for demo)
  const isSuccessful = Math.random() < 0.9;

  if (isSuccessful) {
    intent.status = "succeeded";
    intent.completedAt = new Date();

    // Create receipt
    const pkg = TASKLY_PACKAGES.find((p) => p.id === intent.packageId)!;
    const receipt: PaymentReceipt = {
      id: `rcpt_${Date.now()}`,
      transactionId: intent.id,
      userId: intent.userId,
      tasklysAmount: pkg.tasklys + (pkg.bonus || 0),
      priceUSD: pkg.priceUSD,
      paymentMethod: "mock_card",
      status: "completed",
      createdAt: new Date(),
      invoiceNumber: generateInvoiceNumber(),
    };

    paymentReceipts.push(receipt);
  } else {
    intent.status = "failed";
    intent.errorMessage =
      "Simulated payment failure - Card declined (demo mode)";
  }

  paymentIntents.set(paymentIntentId, intent);
  return intent;
}

/**
 * Get payment intent by ID
 */
export function getPaymentIntent(paymentIntentId: string): PaymentIntent | null {
  return paymentIntents.get(paymentIntentId) || null;
}

/**
 * Get all receipts for a user
 */
export function getUserReceipts(userId: number): PaymentReceipt[] {
  return paymentReceipts.filter((r) => r.userId === userId);
}

/**
 * Get receipt by ID
 */
export function getReceipt(receiptId: string): PaymentReceipt | null {
  return paymentReceipts.find((r) => r.id === receiptId) || null;
}

/**
 * Calculate total Tasklys purchased by user
 */
export function getUserTotalTasklysPurchased(userId: number): number {
  return paymentReceipts
    .filter((r) => r.userId === userId && r.status === "completed")
    .reduce((sum, r) => sum + r.tasklysAmount, 0);
}

/**
 * Get payment statistics (for admin dashboard)
 */
export function getPaymentStats() {
  const totalRevenue = paymentReceipts
    .filter((r) => r.status === "completed")
    .reduce((sum, r) => sum + r.priceUSD, 0);

  const totalTransactions = paymentReceipts.filter(
    (r) => r.status === "completed"
  ).length;

  const totalTasklysSold = paymentReceipts
    .filter((r) => r.status === "completed")
    .reduce((sum, r) => sum + r.tasklysAmount, 0);

  const averageTransactionValue =
    totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalTransactions,
    totalTasklysSold,
    averageTransactionValue: Math.round(averageTransactionValue * 100) / 100,
  };
}

/**
 * Generate receipt PDF content (simple text format)
 */
export function generateReceiptContent(receipt: PaymentReceipt): string {
  const date = receipt.createdAt.toLocaleDateString("es-ES");
  const time = receipt.createdAt.toLocaleTimeString("es-ES");

  return `
╔════════════════════════════════════════╗
║         RECIBO DE COMPRA TASKLY        ║
╚════════════════════════════════════════╝

Número de Factura: ${receipt.invoiceNumber}
Fecha: ${date} ${time}
ID de Transacción: ${receipt.transactionId}

────────────────────────────────────────

DETALLES DE LA COMPRA:

Tasklys Adquiridos: ${receipt.tasklysAmount}
Precio USD: $${receipt.priceUSD.toFixed(2)}
Método de Pago: ${receipt.paymentMethod}
Estado: ${receipt.status === "completed" ? "✓ COMPLETADO" : "✗ FALLIDO"}

────────────────────────────────────────

INFORMACIÓN IMPORTANTE:

• Los Tasklys se han acreditado a tu cuenta
• Puedes usarlos inmediatamente en la plataforma
• Este recibo es válido como comprobante de pago
• Conserva este documento para tus registros

────────────────────────────────────────

Gracias por usar Taskly.
Para soporte: support@taskly.com

════════════════════════════════════════
  `;
}

/**
 * Simulate refund process
 */
export function processRefund(receiptId: string): PaymentReceipt | null {
  const receipt = paymentReceipts.find((r) => r.id === receiptId);
  if (!receipt) {
    return null;
  }

  if (receipt.status !== "completed") {
    throw new Error("Only completed payments can be refunded");
  }

  receipt.status = "refunded";
  return receipt;
}

/**
 * Clear all data (for testing purposes)
 */
export function clearAllData(): void {
  paymentIntents.clear();
  paymentReceipts.length = 0;
}
