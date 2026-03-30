import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { TRPCError } from "@trpc/server";

// Admin-only procedure that checks role
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user?.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const adminRouter = router({
  // Dashboard statistics
  getDashboardStats: adminProcedure.query(async () => {
    return await db.getDashboardStats();
  }),

  // User management
  getAllUsers: adminProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
        role: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      return await db.getAllUsers(input.limit, input.offset, {
        role: input.role,
      });
    }),

  suspendUser: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        reason: z.string(),
        severity: z.enum(["warning", "temporary", "permanent"]),
        suspendUntil: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await db.suspendUser(
        input.userId,
        input.reason,
        input.severity,
        ctx.user.id,
        input.suspendUntil
      );
      return { success: true };
    }),

  unsuspendUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.unsuspendUser(input.userId, ctx.user.id);
      return { success: true };
    }),

  // Disputes
  getDisputes: adminProcedure
    .input(
      z.object({
        status: z.string().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      return await db.getDisputes(input.status, input.limit, input.offset);
    }),

  assignDispute: adminProcedure
    .input(z.object({ disputeId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.assignDisputeToAdmin(input.disputeId, ctx.user.id);
      return { success: true };
    }),

  resolveDispute: adminProcedure
    .input(
      z.object({
        disputeId: z.number(),
        resolution: z.string(),
        resolutionType: z.enum([
          "refund",
          "partial_refund",
          "no_refund",
          "service_completion",
          "other",
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await db.resolveDispute(
        input.disputeId,
        input.resolution,
        input.resolutionType,
        ctx.user.id
      );
      return { success: true };
    }),

  // Content moderation
  getPendingContent: adminProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      return await db.getPendingContentModerations(input.limit, input.offset);
    }),

  reviewContent: adminProcedure
    .input(
      z.object({
        moderationId: z.number(),
        status: z.enum(["approved", "rejected", "removed"]),
        adminNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await db.reviewContentModeration(
        input.moderationId,
        input.status,
        ctx.user.id,
        input.adminNotes
      );
      return { success: true };
    }),

  // Audit logs
  getAuditLogs: adminProcedure
    .input(
      z.object({
        limit: z.number().default(100),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      return await db.getAuditLogs(input.limit, input.offset, ctx.user.id);
    }),
});
