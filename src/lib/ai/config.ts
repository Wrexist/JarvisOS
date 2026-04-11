const DEFAULT_MODEL = "claude-sonnet-4-20250514";

interface AIConfig {
  model: string;
  maxTokens: number;
}

export const AI_OPERATIONS = [
  "idea-enrich",
  "spec-generate",
  "spec-to-tasks",
  "task-breakdown",
  "next-action",
  "task-prompt",
] as const;

export type AIOperation = (typeof AI_OPERATIONS)[number];

const MAX_TOKENS_BY_OPERATION: Record<AIOperation, number> = {
  "idea-enrich": 1024,
  "spec-generate": 4096,
  "spec-to-tasks": 2048,
  "task-breakdown": 2048,
  "next-action": 512,
  "task-prompt": 1024,
};

/**
 * Returns AI model configuration, respecting env-level overrides.
 */
export function getAIConfig(operation?: AIOperation): AIConfig {
  const model = process.env.AI_DEFAULT_MODEL ?? DEFAULT_MODEL;
  const maxTokens = operation
    ? MAX_TOKENS_BY_OPERATION[operation]
    : 1024;

  return { model, maxTokens };
}
