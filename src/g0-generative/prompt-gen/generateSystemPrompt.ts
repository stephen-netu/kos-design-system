/**
 * System Prompt Generator
 * 
 * Generates LLM system prompts from component library definitions.
 */

import type { ComponentLibrary } from '../library/ComponentLibrary';

export interface PromptOptions {
  includeExamples?: boolean;
  maxExamples?: number;
  contextWindow?: number;
  streamingHints?: boolean;
}

export function generateSystemPrompt(
  library: ComponentLibrary,
  options: PromptOptions = {}
): string {
  return library.generatePrompt();
}

/**
 * Example prompt with common UI patterns
 */
export function getExamplePrompt(): string {
  return `
# OpenUI Example: Dashboard Layout

root = Stack([header, stats, chart])
header = Text("Q4 Performance", "large")
stats = Grid([s1, s2, s3])
s1 = StatCard("Revenue", "$1.2M", "up")
s2 = StatCard("Users", "450k", "flat")
s3 = StatCard("Churn", "2.1%", "down")
chart = LineChart([data])
data = DataSeries("Monthly", [jan, feb, mar])
jan = DataPoint("Jan", 100)
feb = DataPoint("Feb", 120)
mar = DataPoint("Mar", 115)
`;
}
