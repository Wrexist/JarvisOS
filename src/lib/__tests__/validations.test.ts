import { describe, it, expect } from "vitest";
import {
  createIdeaSchema,
  createProjectSchema,
  createTaskSchema,
  createDocumentSchema,
  bulkTasksSchema,
} from "@/lib/validations";

describe("createIdeaSchema", () => {
  it("accepts valid input", () => {
    const result = createIdeaSchema.safeParse({
      title: "My idea",
      description: "Details",
      tags: ["ai", "saas"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = createIdeaSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing title", () => {
    const result = createIdeaSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("createProjectSchema", () => {
  it("accepts valid input", () => {
    const result = createProjectSchema.safeParse({ name: "My Project" });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = createProjectSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });
});

describe("createTaskSchema", () => {
  it("accepts valid input", () => {
    const result = createTaskSchema.safeParse({
      title: "My task",
      priority: "HIGH",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid priority", () => {
    const result = createTaskSchema.safeParse({
      title: "Task",
      priority: "INVALID",
    });
    expect(result.success).toBe(false);
  });
});

describe("createDocumentSchema", () => {
  it("accepts valid input", () => {
    const result = createDocumentSchema.safeParse({
      title: "My Doc",
      type: "PRD",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid type", () => {
    const result = createDocumentSchema.safeParse({
      title: "Doc",
      type: "INVALID",
    });
    expect(result.success).toBe(false);
  });
});

describe("bulkTasksSchema", () => {
  it("accepts valid bulk update", () => {
    const result = bulkTasksSchema.safeParse({
      taskIds: ["id1", "id2"],
      status: "DONE",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty taskIds", () => {
    const result = bulkTasksSchema.safeParse({
      taskIds: [],
      status: "DONE",
    });
    expect(result.success).toBe(false);
  });
});
