import { z } from "zod";

export const createIdeaSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(5000).optional(),
  tags: z.array(z.string()).optional(),
});

export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name too long"),
  description: z.string().max(5000).optional(),
});

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(5000).optional(),
  acceptanceCriteria: z.string().max(5000).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  estimateHours: z.number().min(0).max(1000).optional(),
  dueDate: z.string().optional(),
  relevantFiles: z.array(z.string()).optional(),
});

export const createDocumentSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  type: z.enum(["PRD", "TECH_SPEC", "NOTES", "RETRO", "SCRATCHPAD"]),
  content: z.string().optional(),
});

export const createTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  content: z.string().min(1, "Content is required"),
});

export const bulkTasksSchema = z.object({
  taskIds: z.array(z.string()).min(1, "At least one task ID required"),
  status: z.enum(["TODO", "IN_PROGRESS", "BLOCKED", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
});

export const searchSchema = z.object({
  q: z.string().min(2, "Query must be at least 2 characters"),
});

// Update schemas (partial versions of create schemas)
export const updateIdeaSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  summary: z.string().max(5000).nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
  problem: z.string().max(5000).nullable().optional(),
  targetUser: z.string().max(1000).nullable().optional(),
  whyNow: z.string().max(5000).nullable().optional(),
  monetization: z.string().max(5000).nullable().optional(),
  risks: z.string().max(5000).nullable().optional(),
  assumptions: z.string().max(5000).nullable().optional(),
  score: z.number().min(0).max(100).nullable().optional(),
  status: z.enum(["INBOX", "REVIEWING", "VALIDATED", "CONVERTED", "ARCHIVED"]).optional(),
  tags: z.array(z.string()).optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).nullable().optional(),
  stage: z.enum(["CLARIFYING", "PLANNING", "READY_TO_BUILD", "BUILDING", "TESTING", "SHIPPED", "PAUSED", "ARCHIVED"]).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).nullable().optional(),
  acceptanceCriteria: z.string().max(5000).nullable().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "BLOCKED", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  estimateHours: z.number().min(0).max(1000).nullable().optional(),
  dueDate: z.string().nullable().optional(),
  relevantFiles: z.array(z.string()).optional(),
});
