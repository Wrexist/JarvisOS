/**
 * Renders a prompt template by replacing {{variable}} placeholders with values.
 */
export function renderTemplate(
  content: string,
  vars: Record<string, string>
): string {
  return content.replace(
    /\{\{(\w+)\}\}/g,
    (_, key: string) => vars[key] ?? `{{${key}}}`
  );
}

/** Default idea enrichment prompt (fallback if no DB template exists). */
export const IDEA_ENRICH_PROMPT = `You are a product strategist.

Turn this raw idea into a structured product concept.

Return JSON with:
- summary
- problem
- targetUser
- whyNow
- monetization
- risks
- assumptions
- score (1-100)

Idea title:
{{idea_title}}

Idea description:
{{idea_description}}`;
