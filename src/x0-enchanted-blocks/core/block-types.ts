// Block Types — 14 spatial research classifications
// Based on Nodepad's auto-classification system

/** The 14 types of enchanted blocks for spatial research */
export type BlockType =
  | 'claim'        // Asserted truth or proposition
  | 'question'     // Open inquiry or research question
  | 'idea'         // Proposed concept or hypothesis
  | 'task'         // Action item or todo (Ryu integration)
  | 'entity'       // Named thing (person, organization, concept)
  | 'quote'        // External citation or verbatim excerpt
  | 'reference'    // Link, pointer, or citation
  | 'definition'   // Term explanation or glossary entry
  | 'opinion'      // Subjective stance or perspective
  | 'reflection'   // Self-aware musing or metacognition
  | 'narrative'    // Story, timeline, or sequential account
  | 'comparison'   // Side-by-side analysis or contrast
  | 'thesis'       // Synthesized position or argument
  | 'general';     // Unclassified or mixed content

/** All block types as an array for iteration */
export const ALL_BLOCK_TYPES: BlockType[] = [
  'claim',
  'question',
  'idea',
  'task',
  'entity',
  'quote',
  'reference',
  'definition',
  'opinion',
  'reflection',
  'narrative',
  'comparison',
  'thesis',
  'general',
];

/** Human-readable labels for each block type */
export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  claim: 'Claim',
  question: 'Question',
  idea: 'Idea',
  task: 'Task',
  entity: 'Entity',
  quote: 'Quote',
  reference: 'Reference',
  definition: 'Definition',
  opinion: 'Opinion',
  reflection: 'Reflection',
  narrative: 'Narrative',
  comparison: 'Comparison',
  thesis: 'Thesis',
  general: 'Note',
};

/** Lucide icon names for each block type */
export const BLOCK_TYPE_ICONS: Record<BlockType, string> = {
  claim: 'CheckCircle',      // Asserted truth
  question: 'HelpCircle',    // Inquiry
  idea: 'Lightbulb',         // Concept
  task: 'CheckSquare',       // Action item
  entity: 'Box',             // Named thing
  quote: 'Quote',            // Citation
  reference: 'Link',         // Pointer
  definition: 'BookOpen',    // Explanation
  opinion: 'MessageCircle',  // Subjective view
  reflection: 'Mirror',      // Self-aware
  narrative: 'ScrollText',   // Story
  comparison: 'Scale',       // Analysis
  thesis: 'GraduationCap',   // Synthesized argument
  general: 'StickyNote',     // Default
};

/** 
 * CSS color tokens for each block type.
 * Uses KOS brass/copper palette with semantic differentiation.
 * Format: HSL values for --type-color CSS custom property.
 */
export const BLOCK_TYPE_COLORS: Record<BlockType, string> = {
  // Warm/assertive types (brass/gold variants)
  claim: 'hsl(30, 60%, 55%)',      // Brass
  thesis: 'hsl(25, 70%, 50%)',     // Copper
  task: 'hsl(35, 55%, 50%)',       // Bronze
  
  // Cool/inquisitive types (muted complementary)
  question: 'hsl(210, 50%, 60%)',  // Steel blue
  idea: 'hsl(160, 45%, 50%)',      // Sage
  opinion: 'hsl(280, 40%, 55%)',   // Muted purple
  
  // Reference/external types (neutral)
  quote: 'hsl(0, 0%, 70%)',        // Silver
  reference: 'hsl(200, 30%, 60%)', // Slate
  definition: 'hsl(180, 35%, 55%)', // Teal
  
  // Process/meta types (warm earth)
  reflection: 'hsl(45, 50%, 55%)', // Amber
  narrative: 'hsl(20, 45%, 50%)',  // Terracotta
  comparison: 'hsl(40, 45%, 50%)', // Gold ochre
  
  // Structural types
  entity: 'hsl(220, 40%, 55%)',   // Denim
  general: 'hsl(30, 40%, 50%)',    // Default brass
};

/** Get the next type in sequence (for cycling via click) */
export function nextBlockType(current: BlockType): BlockType {
  const idx = ALL_BLOCK_TYPES.indexOf(current);
  return ALL_BLOCK_TYPES[(idx + 1) % ALL_BLOCK_TYPES.length];
}

/** Get the previous type in sequence */
export function prevBlockType(current: BlockType): BlockType {
  const idx = ALL_BLOCK_TYPES.indexOf(current);
  return ALL_BLOCK_TYPES[(idx - 1 + ALL_BLOCK_TYPES.length) % ALL_BLOCK_TYPES.length];
}

/** 
 * Simple heuristic classifier based on content patterns.
 * Returns confidence score 0-1 alongside type.
 */
export function classifyBlockHeuristic(content: string): { type: BlockType; confidence: number } {
  const lower = content.toLowerCase().trim();
  
  // Question detection
  if (lower.match(/^(what|why|how|when|where|who|is\s+it|are\s+they|can\s+we|should\s+we)\b/i) || 
      lower.endsWith('?')) {
    return { type: 'question', confidence: 0.9 };
  }
  
  // Task detection
  if (lower.match(/^(todo|task|action|implement|fix|add|remove|update|create|build)\b/i) ||
      lower.match(/\[x\]|\[ \]|\[-\]/)) {
    return { type: 'task', confidence: 0.85 };
  }
  
  // Quote detection
  if (lower.startsWith('"') && lower.includes('"') ||
      lower.startsWith('"') && lower.endsWith('"') ||
      lower.match(/^as\s+\w+\s+said/i)) {
    return { type: 'quote', confidence: 0.8 };
  }
  
  // Definition detection
  if (lower.match(/\bis\s+(defined\s+as|a\s+type\s+of|the\s+process\s+of)\b/i) ||
      lower.match(/^\w+:\s+\w+/)) {
    return { type: 'definition', confidence: 0.75 };
  }
  
  // Claim detection (assertive language)
  if (lower.match(/\b(is|are|will|must|should|always|never|proves|shows|demonstrates)\b/i) &&
      !lower.endsWith('?')) {
    return { type: 'claim', confidence: 0.7 };
  }
  
  // Idea detection
  if (lower.match(/\b(idea|concept|proposal|suggest|consider|perhaps|maybe|could|might)\b/i)) {
    return { type: 'idea', confidence: 0.65 };
  }
  
  // Reference detection
  if (lower.match(/^(see|cf\.|refer\s+to|check\s+out|read|http|www\.|github\.com)/i)) {
    return { type: 'reference', confidence: 0.8 };
  }
  
  // Narrative detection (time words)
  if (lower.match(/\b(then|next|after|before|finally|eventually|once|when\s+we)\b/i)) {
    return { type: 'narrative', confidence: 0.6 };
  }
  
  // Comparison detection
  if (lower.match(/\b(vs|versus|compared\s+to|unlike|similarly|both|either|or)\b/i)) {
    return { type: 'comparison', confidence: 0.65 };
  }
  
  // Reflection detection (self-aware)
  if (lower.match(/\b(i\s+think|i\s+wonder|i\s+realized|reflecting|thinking\s+about)\b/i)) {
    return { type: 'reflection', confidence: 0.7 };
  }
  
  // Opinion detection
  if (lower.match(/\b(i\s+believe|in\s+my\s+opinion|personally|i\s+feel|i\s+prefer)\b/i)) {
    return { type: 'opinion', confidence: 0.75 };
  }
  
  // Entity detection (proper nouns, capitalized)
  if (lower.match(/^[A-Z][a-z]+\s+(is|was|are|refers\s+to)/)) {
    return { type: 'entity', confidence: 0.6 };
  }
  
  return { type: 'general', confidence: 0.5 };
}

/** Core data structure for an enchanted block */
export interface EnchantedBlockData {
  id: string;
  type: BlockType;
  content: string;
  
  /** AI-generated annotation: "what the note doesn't say" */
  annotation?: string;
  
  /** Epistemic provenance from KVE */
  provenance?: {
    source: string;
    createdAt: number;
    modifiedAt: number;
    confidence?: number;
  };
  
  /** Inferred connections to other blocks */
  connections?: {
    targetId: string;
    strength: number; // 0.0 - 1.0
    type: 'supports' | 'contradicts' | 'extends' | 'similar' | 'related';
  }[];
  
  /** Spatial position (for canvas views) */
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  
  /** Timestamps */
  createdAt: number;
  modifiedAt: number;
}
