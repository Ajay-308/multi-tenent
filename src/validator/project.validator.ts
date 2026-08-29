import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1).max(150),
  description: z.string().max(5000).optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export default {
  createProjectSchema,
  updateProjectSchema,
  listQuerySchema,
};
