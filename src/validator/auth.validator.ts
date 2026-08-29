import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(72), // bcrypt 72-byte cap
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1),
});

export type RegisterSchema = z.infer<typeof registerSchema>;
export type LoginSchema = z.infer<typeof loginSchema>;
export type RefreshSchema = z.infer<typeof refreshSchema>;
export type LogoutSchema = z.infer<typeof logoutSchema>;

export default {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
};
