import { z } from "zod";

export const addMemberSchema = z
  .object({
    userId: z.string().uuid().optional(),
    email: z.string().email().optional(),
    role: z.enum(["org_admin", "member"]).default("member"),
  })
  .refine((data) => data.userId || data.email, {
    message: "Either userId or email is required",
    path: ["userId"],
  });

export const listMembersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export default { addMemberSchema, listMembersQuerySchema };
