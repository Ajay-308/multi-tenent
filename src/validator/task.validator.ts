import { z } from "zod";

const statusEnum = z.enum(["todo", "in_progress", "review", "done"]);
const priorityEnum = z.enum(["low", "medium", "high", "urgent"]);
// Keep date validation compatible with older Zod versions.
const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(10000).optional(),
  status: statusEnum.optional(),
  priority: priorityEnum.optional(),
  due_date: dateString.optional(),
});

export const updateTaskSchema = createTaskSchema.partial();

export const listTasksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: statusEnum.optional(),
  priority: priorityEnum.optional(),
  assignee: z.string().uuid().optional(),
  due_from: dateString.optional(),
  due_to: dateString.optional(),
});

export const assignTaskSchema = z.object({
  userId: z.string().uuid(),
});

export const bulkStatusUpdateSchema = z.object({
  taskIds: z.array(z.string().uuid()).min(1).max(100),
  status: statusEnum,
});

export const searchQuerySchema = z.object({
  q: z.string().min(1),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export default {
  createTaskSchema,
  updateTaskSchema,
  listTasksQuerySchema,
  assignTaskSchema,
  bulkStatusUpdateSchema,
  searchQuerySchema,
};
