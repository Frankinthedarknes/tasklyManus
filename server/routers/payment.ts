import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as mockPayment from "../_core/mockPayment";
import * as db from "../db";
import { TRPCError } from "@trpc/server";

export const paymentRouter = router({
  getPackages: publicProcedure.query(() => mockPayment.TASKLY_PACKAGES),

  createPaymentIntent: protectedProcedure
    .input(z.object({ packageId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const intent = mockPayment.createPaymentIntent(ctx.user.id, input.packageId);
      return intent;
    }),

  processPayment: protectedProcedure
    .input(z.object({ paymentIntentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const intent = mockPayment.processPayment(input.paymentIntentId);

      if (intent.status === "succeeded") {
        // Get the package details
        const pkg = mockPayment.TASKLY_PACKAGES.find((p) => p.id === intent.packageId);
        if (pkg) {
          const tasklysToAdd = pkg.tasklys + (pkg.bonus || 0);
          // Update wallet
          await db.updateWalletBalance(ctx.user.id, tasklysToAdd);
          // Record transaction
          await db.createTokenTransaction(
            ctx.user.id,
            "purchase",
            tasklysToAdd,
            `Purchased ${pkg.tasklys} Tasklys (+ ${pkg.bonus || 0} bonus)`
          );
        }
      }

      return intent;
    }),

  getPaymentIntent: protectedProcedure
    .input(z.object({ paymentIntentId: z.string() }))
    .query(({ input }) => {
      return mockPayment.getPaymentIntent(input.paymentIntentId);
    }),

  getUserReceipts: protectedProcedure.query(async ({ ctx }) => {
    return mockPayment.getUserReceipts(ctx.user.id);
  }),

  getReceipt: protectedProcedure
    .input(z.object({ receiptId: z.string() }))
    .query(({ input }) => {
      return mockPayment.getReceipt(input.receiptId);
    }),

  getReceiptContent: protectedProcedure
    .input(z.object({ receiptId: z.string() }))
    .query(({ input }) => {
      const receipt = mockPayment.getReceipt(input.receiptId);
      if (!receipt) throw new TRPCError({ code: "NOT_FOUND" });
      return mockPayment.generateReceiptContent(receipt);
    }),

  getUserTotalPurchased: protectedProcedure.query(async ({ ctx }) => {
    return mockPayment.getUserTotalTasklysPurchased(ctx.user.id);
  }),

  getPaymentStats: protectedProcedure.query(async ({ ctx }) => {
    // Only admins can see stats
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return mockPayment.getPaymentStats();
  }),
});
