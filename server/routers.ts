import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { validateFileSize, validateMediaFile } from "./storage";
import { TRPCError } from "@trpc/server";
import { adminRouter } from "./routers/admin";
import { paymentRouter } from "./routers/payment";
import * as mockPayment from "./_core/mockPayment";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    sendVerificationCode: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        // TODO: Check if email already exists using getUserByEmail
        // For now, skip duplicate check
        // In production, send actual email with verification code
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        // Store code in cache/temp storage (implement as needed)
        return { success: true, code }; // Remove code from response in production
      }),
    verifyCode: publicProcedure
      .input(z.object({ email: z.string().email(), code: z.string() }))
      .mutation(async ({ input }) => {
        // Verify the code (implement proper verification logic)
        return { success: true };
      }),
    register: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(8),
          name: z.string().min(2),
          phone: z.string().optional(),
          photoUrl: z.string().optional(),
          role: z.enum(["provider", "requester"]),
        })
      )
      .mutation(async ({ input }) => {
        // TODO: Implement actual user creation
        // 1. Check if email already exists
        // 2. Hash password
        // 3. Store in DB with role and photo
        // 4. Create session
        return { success: true, message: "Cuenta creada exitosamente" };
      }),
  }),

  // User management
  user: router({
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });

      const wallet = await db.getOrCreateWallet(ctx.user.id);
      const ratings = await db.getUserRatings(ctx.user.id);

      const avgRating =
        ratings.length > 0
          ? ratings.reduce((sum, r) => sum + (r.score ?? 0), 0) / ratings.length
          : 0;

      return {
        ...user,
        wallet,
        averageRating: avgRating,
        totalRatings: ratings.length,
      };
    }),

    updateProfile: protectedProcedure
      .input(
        z.object({
          name: z.string().optional(),
          bio: z.string().optional(),
          photoUrl: z.string().optional(),
          latitude: z.number().optional(),
          longitude: z.number().optional(),
          preferences: z.record(z.string(), z.any()).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const updated = await db.updateUserProfile(ctx.user.id, input);
        return updated;
      }),

    updateLocation: protectedProcedure
      .input(
        z.object({
          latitude: z.number(),
          longitude: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const updated = await db.updateUserProfile(ctx.user.id, {
          latitude: input.latitude,
          longitude: input.longitude,
          locationUpdatedAt: new Date(),
        });
        return updated;
      }),

    verifyPhone: protectedProcedure
      .input(z.object({ phone: z.string() }))
      .mutation(async ({ ctx, input }) => {
        // In production, integrate with SMS service (Twilio, etc.)
        const updated = await db.updateUserProfile(ctx.user.id, {
          phone: input.phone,
          phoneVerified: true,
        });
        return updated;
      }),

    verifyPhoto: protectedProcedure
      .input(z.object({ photoUrl: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const updated = await db.updateUserProfile(ctx.user.id, {
          photoUrl: input.photoUrl,
          photoVerified: true,
        });
        return updated;
      }),
  }),

  // Wallet and tokens
  wallet: router({
    getBalance: protectedProcedure.query(async ({ ctx }) => {
      const wallet = await db.getOrCreateWallet(ctx.user.id);
      return wallet;
    }),

    getTransactionHistory: protectedProcedure
      .input(z.object({ limit: z.number().default(50) }))
      .query(async ({ ctx, input }) => {
        // TODO: Implement transaction history query
        return [];
      }),

    purchaseTasklys: protectedProcedure
      .input(
        z.object({
          packageId: z.enum(["5", "20", "50", "100"]),
          // In production, integrate with payment provider
        })
      )
      .mutation(async ({ ctx, input }) => {
        const packages: Record<string, { amount: number; price: number }> = {
          "5": { amount: 5, price: 2 },
          "20": { amount: 20, price: 7 },
          "50": { amount: 50, price: 15 },
          "100": { amount: 100, price: 25 },
        };

        const pkg = packages[input.packageId];
        if (!pkg) throw new TRPCError({ code: "BAD_REQUEST" });

        // Update wallet
        await db.updateWalletBalance(ctx.user.id, pkg.amount);

        // Record transaction
        await db.createTokenTransaction(
          ctx.user.id,
          "purchase",
          pkg.amount,
          `Purchased ${pkg.amount} Tasklys`
        );

        return { success: true, amount: pkg.amount };
      }),

    withdrawTasklys: protectedProcedure
      .input(z.object({ amount: z.number().min(20) }))
      .mutation(async ({ ctx, input }) => {
        const wallet = await db.getOrCreateWallet(ctx.user.id);
        if (!wallet || (wallet.balance ?? 0) < input.amount) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Insufficient balance. Minimum withdrawal: 20 Tasklys",
          });
        }

        // Deduct from wallet
        await db.updateWalletBalance(ctx.user.id, -input.amount);

        // Record transaction
        await db.createTokenTransaction(
          ctx.user.id,
          "withdrawal",
          input.amount,
          `Withdrawn ${input.amount} Tasklys`
        );

        return { success: true, amount: input.amount };
      }),
  }),

  // Recommendations
  recommendations: router({
    getByCategory: publicProcedure
      .input(z.object({ category: z.string(), limit: z.number().default(10) }))
      .query(async ({ input }) => {
        const providers = await db.getRecommendedProviders(
          input.category,
          input.limit,
          1
        );
        return providers;
      }),

    getTopProviders: publicProcedure
      .input(z.object({ category: z.string(), limit: z.number().default(5) }))
      .query(async ({ input }) => {
        const providers = await db.getTopProvidersByCategory(
          input.category,
          input.limit
        );
        return providers;
      }),

    getByBadgeType: publicProcedure
      .input(
        z.object({
          badgeType: z.string(),
          category: z.string().optional(),
          limit: z.number().default(10),
        })
      )
      .query(async ({ input }) => {
        const providers = await db.getProvidersByBadgeType(
          input.badgeType,
          input.category,
          input.limit
        );
        return providers;
      }),

    getScore: publicProcedure
      .input(z.object({ userId: z.number(), category: z.string().optional() }))
      .query(async ({ input }) => {
        const score = await db.calculateRecommendationScore(
          input.userId,
          input.category
        );
        return { score };
      }),
  }),

  // Service Selections
  serviceSelections: router({
    save: protectedProcedure
      .input(
        z.object({
          serviceId: z.number(),
          type: z.enum(["liked", "saved", "contacted"]).default("liked"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await db.saveServiceSelection(
          ctx.user.id,
          input.serviceId,
          input.type
        );
        return { success: !!result };
      }),

    getByUser: protectedProcedure
      .input(
        z.object({
          type: z.enum(["liked", "saved", "contacted"]).optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        const selections = await db.getUserServiceSelections(
          ctx.user.id,
          input.type
        );
        return selections;
      }),
  }),

  // User Media
  userMedia: router({
    getUploadUrl: protectedProcedure
      .input(
        z.object({
          type: z.enum(["photo", "video"]),
          fileName: z.string(),
          fileSize: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Validate file
        try {
          const storage = await import("./storage");
          storage.validateFileSize(input.fileSize, input.type);
          storage.validateMediaFile(input.fileName, input.type);
          return { success: true, fileName: input.fileName };
        } catch (error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: (error as Error).message,
          });
        }
      }),

    add: protectedProcedure
      .input(
        z.object({
          type: z.enum(["photo", "video"]),
          url: z.string().url(),
          title: z.string().optional(),
          description: z.string().optional(),
          isMain: z.boolean().default(false),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await db.addUserMedia(
          ctx.user.id,
          input.type,
          input.url,
          input.title,
          input.description,
          input.isMain
        );
        return { success: !!result };
      }),

    getByUser: protectedProcedure
      .input(z.object({ type: z.enum(["photo", "video"]).optional() }))
      .query(async ({ ctx, input }) => {
        const media = await db.getUserMedia(ctx.user.id, input.type);
        return media;
      }),

    setMain: protectedProcedure
      .input(z.object({ mediaId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.setMainUserPhoto(input.mediaId, ctx.user.id);
        return { success: !!result };
      }),

    delete: protectedProcedure
      .input(z.object({ mediaId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.deleteUserMedia(input.mediaId);
        return { success: !!result };
      }),

    reorder: protectedProcedure
      .input(z.object({ mediaIds: z.array(z.number()) }))
      .mutation(async ({ input }) => {
        const result = await db.updateMediaDisplayOrder(
          0,
          input.mediaIds
        );
        return { success: result };
      }),
  }),

  // User Skills
  userSkills: router({
    add: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          category: z.string(),
          description: z.string().optional(),
          yearsOfExperience: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await db.addUserSkill(
          ctx.user.id,
          input.name,
          input.category,
          input.description,
          input.yearsOfExperience
        );
        return { success: !!result };
      }),

    getByUser: protectedProcedure.query(async ({ ctx }) => {
      const skills = await db.getUserSkills(ctx.user.id);
      return skills;
    }),

    delete: protectedProcedure
      .input(z.object({ skillId: z.number() }))
      .mutation(async ({ input }) => {
        const result = await db.deleteUserSkill(input.skillId);
        return { success: !!result };
      }),
  }),

  // Services
  services: router({
    create: protectedProcedure
      .input(
        z.object({
          title: z.string(),
          description: z.string(),
          category: z.string(),
          priceInTasklys: z.number(),
          latitude: z.number(),
          longitude: z.number(),
          address: z.string().optional(),
          urgency: z.enum(["now", "today", "flexible"]).default("flexible"),
          type: z.enum(["offer", "request"]),
          photos: z.array(z.string()).optional(),
          videos: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const service = await db.createService({
          ...input,
          createdById: ctx.user.id,
          photos: input.photos,
          videos: input.videos,
        });
        return service;
      }),

    getNearby: protectedProcedure
      .input(
        z.object({
          latitude: z.number(),
          longitude: z.number(),
          radiusKm: z.number().default(5),
          type: z.enum(["offer", "request"]).optional(),
          limit: z.number().default(20),
        })
      )
      .query(async ({ input }) => {
        const services = await db.getNearbyServices(
          input.latitude,
          input.longitude,
          input.radiusKm,
          input.type,
          input.limit
        );
        return services;
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const service = await db.getServiceById(input.id);
        if (!service) throw new TRPCError({ code: "NOT_FOUND" });
        return service;
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z
            .enum(["published", "in_progress", "completed", "cancelled"])
            .optional(),
          assignedToId: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const service = await db.getServiceById(input.id);
        if (!service) throw new TRPCError({ code: "NOT_FOUND" });
        if (service.createdById !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        // TODO: Update service in database
        return service;
      }),

    getSaved: protectedProcedure.query(async ({ ctx }) => {
      const saved = await db.getSavedServices(ctx.user.id);
      return saved;
    }),

    save: protectedProcedure
      .input(z.object({ serviceId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.saveService(ctx.user.id, input.serviceId);
        return { success: true };
      }),

    unsave: protectedProcedure
      .input(z.object({ serviceId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.removeSavedService(ctx.user.id, input.serviceId);
        return { success: true };
      }),

    getFiltered: protectedProcedure
      .input(
        z.object({
          latitude: z.number(),
          longitude: z.number(),
          maxDistance: z.number().default(50),
          categories: z.array(z.string()).optional(),
          priceMin: z.number().default(0),
          priceMax: z.number().default(10000),
          urgencies: z.array(z.enum(["now", "today", "flexible"])).optional(),
          limit: z.number().default(50),
        })
      )
      .query(async ({ input }) => {
        const services = await db.getNearbyServices(
          input.latitude,
          input.longitude,
          input.maxDistance,
          undefined,
          input.limit
        );

        // Apply filters
        return services.filter((service: any) => {
          // Category filter
          if (input.categories && input.categories.length > 0) {
            if (!input.categories.includes(service.category)) return false;
          }

          // Price filter
          if (service.priceInTasklys < input.priceMin || service.priceInTasklys > input.priceMax) {
            return false;
          }

          // Urgency filter
          if (input.urgencies && input.urgencies.length > 0) {
            if (!input.urgencies.includes(service.urgency)) return false;
          }

          return true;
        });
      }),
  }),

  // Escrow and payments
  escrow: router({
    createTransaction: protectedProcedure
      .input(
        z.object({
          serviceId: z.number(),
          providerId: z.number(),
          amountInTasklys: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Verify wallet has sufficient balance
        const wallet = await db.getOrCreateWallet(ctx.user.id);
        if (!wallet || (wallet.balance ?? 0) < input.amountInTasklys) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Insufficient Tasklys balance",
          });
        }

        // Lock tokens in escrow
        await db.updateWalletBalance(ctx.user.id, -input.amountInTasklys);

        // Create escrow transaction
        const escrow = await db.createEscrowTransaction(
          input.serviceId,
          ctx.user.id,
          input.providerId,
          input.amountInTasklys
        );

        // Record transaction
        await db.createTokenTransaction(
          ctx.user.id,
          "spend",
          input.amountInTasklys,
          `Service payment (escrow)`,
          input.serviceId
        );

        return escrow;
      }),

    completeTransaction: protectedProcedure
      .input(z.object({ escrowId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const escrow = await db.getEscrowTransactionById(input.escrowId);
        if (!escrow) throw new TRPCError({ code: "NOT_FOUND" });

        if (escrow.requesterId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        // Release tokens to provider
        await db.updateWalletBalance(
          escrow.providerId,
          escrow.amountInTasklys
        );

        // Update escrow status
        const updated = await db.updateEscrowStatus(input.escrowId, "completed");

        // Record transaction for provider
        await db.createTokenTransaction(
          escrow.providerId,
          "earn",
          escrow.amountInTasklys,
          `Service payment received`,
          escrow.serviceId
        );

        return updated;
      }),

    refundTransaction: protectedProcedure
      .input(z.object({ escrowId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const escrow = await db.getEscrowTransactionById(input.escrowId);
        if (!escrow) throw new TRPCError({ code: "NOT_FOUND" });

        if (escrow.requesterId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        // Return tokens to requester
        await db.updateWalletBalance(
          escrow.requesterId,
          escrow.amountInTasklys
        );

        // Update escrow status
        const updated = await db.updateEscrowStatus(input.escrowId, "refunded");

        // Record transaction
        await db.createTokenTransaction(
          escrow.requesterId,
          "refund",
          escrow.amountInTasklys,
          `Service payment refunded`,
          escrow.serviceId
        );

        return updated;
      }),
  }),

  // Chat
  chat: router({
    getOrCreateConversation: protectedProcedure
      .input(z.object({ otherUserId: z.number() }))
      .query(async ({ ctx, input }) => {
        const conversation = await db.getOrCreateConversation(
          ctx.user.id,
          input.otherUserId
        );
        return conversation;
      }),

    sendMessage: protectedProcedure
      .input(
        z.object({
          conversationId: z.number(),
          content: z.string(),
          isQuickMessage: z.boolean().default(false),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const messageId = await db.addChatMessage(
          input.conversationId,
          ctx.user.id,
          input.content,
          input.isQuickMessage
        );
        return { success: true, messageId };
      }),

    getMessages: protectedProcedure
      .input(
        z.object({
          conversationId: z.number(),
          limit: z.number().default(50),
        })
      )
      .query(async ({ input }) => {
        const messages = await db.getConversationMessages(
          input.conversationId,
          input.limit
        );
        return messages;
      }),
  }),

  // Ratings and reviews
  ratings: router({
    createRating: protectedProcedure
      .input(
        z.object({
          serviceId: z.number(),
          ratedUserId: z.number(),
          score: z.number().min(1).max(5),
          review: z.string().optional(),
          categories: z.record(z.string(), z.number()).optional(),
          badges: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const ratingId = await db.createRating(
          input.serviceId,
          ctx.user.id,
          input.ratedUserId,
          input.score,
          input.review,
          input.categories,
          input.badges
        );
        return { success: true, ratingId };
      }),

    getUserRatings: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const ratings = await db.getUserRatings(input.userId);
        return ratings;
      }),

    getPendingReviews: protectedProcedure.query(async ({ ctx }) => {
      const pendingReviews = await db.getPendingReviews(ctx.user.id);
      return pendingReviews;
    }),

    canInteract: protectedProcedure.query(async ({ ctx }) => {
      const canInteract = await db.canUserInteract(ctx.user.id);
      return { canInteract };
    }),

    calculateBadges: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        const badges = await db.calculateAndAwardBadges(input.userId);
        return { success: true, badgesAwarded: badges.length };
      }),

    getBadges: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const badges = await db.getUserBadges(input.userId);
        return badges;
      })
  }),

  // Gamification
  gamification: router({
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });

      const levelNames = [
        "Nuevo",
        "Activo",
        "Confiable",
        "Pro",
        "Leyenda",
      ];

      return {
        level: user.level ?? 1,
        levelName: levelNames[(user.level ?? 1) - 1],
        totalPoints: user.totalPoints ?? 0,
        streak: user.streak ?? 0,
        servicesCompleted: user.servicesCompleted ?? 0,
        averageRating: user.averageRating ?? 0,
      };
    }),

    addPoints: protectedProcedure
      .input(z.object({ points: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (!user) throw new TRPCError({ code: "NOT_FOUND" });

        const newPoints = (user.totalPoints ?? 0) + input.points;

        await db.updateUserProfile(ctx.user.id, {
          totalPoints: newPoints,
        });

        // Check for level up
        const newLevel = await db.updateUserLevel(ctx.user.id);

        return { success: true, newPoints, newLevel };
      }),
  }),

  // Onboarding
  onboarding: router({
    grantFreeTasklys: protectedProcedure.mutation(async ({ ctx }) => {
      // Check if user already has free tokens
      const existing = await db.getActiveFreeTokens(ctx.user.id);
      if (existing.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Free Tasklys already granted",
        });
      }

      // Grant 5 free Tasklys
      await db.createFreeTokenPromotion(ctx.user.id, 5, 48);

      // Add to wallet
      await db.updateWalletBalance(ctx.user.id, 5);

      // Record transaction
      await db.createTokenTransaction(
        ctx.user.id,
        "earn",
        5,
        "Onboarding bonus - expires in 48h"
      );

      return { success: true, amount: 5 };
    }),

    getOnboardingStatus: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });

      return {
        photoVerified: user.photoVerified ?? false,
        phoneVerified: user.phoneVerified ?? false,
        emailVerified: user.emailVerified ?? false,
        locationSet: user.latitude !== null && user.longitude !== null,
      };
    }),
  }),

  // Admin panel
  admin: adminRouter,
  payment: paymentRouter,
});

export type AppRouter = typeof appRouter;
