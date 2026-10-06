import { z } from "zod";

export const emailInput = z.string().trim().toLowerCase().max(254).email();
export const passwordInput = z.string().min(12).max(128);
export const signUpInput = z.object({
  name: z.string().trim().min(2).max(80),
  email: emailInput,
  password: passwordInput
}).strict();
export const signInInput = z.object({ email: emailInput, password: z.string().min(1).max(128) }).strict();
export const profileInput = z.object({
  name: z.string().trim().min(2).max(80),
  city: z.string().trim().max(100),
  bio: z.string().trim().max(500)
}).strict();

export type Profile = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  joinedAt: string;
  city: string;
  bio: string;
};
