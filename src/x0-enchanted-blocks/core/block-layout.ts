// Block Layout Engine — DOM-free text measurement using Pretext
// Provides accurate sizing for adaptive block rendering

import { prepareWithSegments, layout, measureNaturalWidth as pretextMeasureNatural } from '@chenglou/pretext';

/** Layout options for text measurement */
export interface LayoutOptions {
  /** White space handling: 'normal' (collapse) or 'pre-wrap' (preserve) */
  whiteSpace?: 'normal' | 'pre-wrap';
  /** Word breaking: 'normal' (break at word boundaries) or 'keep-all' (CJK/Hangul) */
  wordBreak?: 'normal' | 'keep-all';
}

/** Metrics returned from block measurement */
export interface BlockMetrics {
  /** Minimum width before text wraps to additional lines (shrink-wrap) */
  minWidth: number;
  /** Optimal reading width (~65 characters) */
  idealWidth: number;
  /** Total height at the measured width */
  height: number;
  /** Number of lines at the measured width */
  lineCount: number;
  /** True if content exceeds reasonable display limits */
  hasOverflow: boolean;
  /** The font string used for measurement */
  font: string;
}

/** Default font configuration matching KOS design system */
export const DEFAULT_FONT = '14px "Sovereign Sans", system-ui, -apple-system, sans-serif';

/** Default monospace font for code/preformatted content */
export const DEFAULT_MONO_FONT = '13px "Sovereign Mono", "SF Mono", Monaco, "Cascadia Code", monospace';

/** Ideal reading width in pixels (~65ch at 14px) */
export const IDEAL_READING_WIDTH = 520;

/** Maximum reasonable block height before overflow indicator */
export const MAX_BLOCK_HEIGHT = 400;

/** Maximum characters before overflow detection */
export const MAX_CONTENT_LENGTH = 5000;

/**
 * Measure block content using Pretext's DOM-free layout engine.
 * 
 * This function uses canvas-based text measurement for accurate sizing
 * without triggering DOM layout/reflow cycles.
 * 
 * @param content - The text content to measure
 * @param font - Font specification string (defaults to DEFAULT_FONT)
 * @param maxWidth - Maximum container width constraint
 * @param options - Layout options (whiteSpace, wordBreak)
 * @param lineHeight - Line height multiplier (default: 1.6)
 * @returns BlockMetrics with sizing information
 * 
 * @example
 * ```typescript
 * const metrics = measureBlock(
 *   'Task: Implement authentication system with OAuth2 support',
 *   '14px Inter',
 *   400,
 *   { whiteSpace: 'normal' }
 * );
 * // metrics.height → precise pixel height
 * // metrics.lineCount → number of wrapped lines
 * ```
 */
export function measureBlock(
  content: string,
  font: string = DEFAULT_FONT,
  maxWidth: number = IDEAL_READING_WIDTH,
  options: LayoutOptions = {},
  lineHeight: number = 1.6
): BlockMetrics {
  // SSR Safety: Pretext requires DOM/Canvas. Return safe defaults if run on server.
  if (typeof window === 'undefined') {
    return {
      minWidth: 0,
      idealWidth: Math.min(IDEAL_READING_WIDTH, maxWidth),
      height: lineHeight * 14,
      lineCount: 1,
      hasOverflow: false,
      font,
    };
  }

  // Handle empty content
  if (!content || content.length === 0) {
    return {
      minWidth: 0,
      idealWidth: Math.min(IDEAL_READING_WIDTH, maxWidth),
      height: lineHeight * 14, // One line height
      lineCount: 1,
      hasOverflow: false,
      font,
    };
  }

  // Truncate extremely long content to prevent performance issues
  const truncatedContent = content.length > MAX_CONTENT_LENGTH 
    ? content.slice(0, MAX_CONTENT_LENGTH) + '…'
    : content;

  // Prepare text for measurement (one-time work)
  const prepared = prepareWithSegments(truncatedContent, font, {
    whiteSpace: options.whiteSpace ?? 'normal',
    wordBreak: options.wordBreak ?? 'normal',
  });

  // Measure at the target width
  const { height, lineCount } = layout(prepared, maxWidth, lineHeight);

  // Calculate shrink-wrap width (tightest fit)
  const minWidth = pretextMeasureNatural(prepared);

  // Determine ideal width (between min and max, capped at reading width)
  const idealWidth = Math.min(
    Math.max(minWidth, Math.min(IDEAL_READING_WIDTH, maxWidth)),
    maxWidth
  );

  // Detect overflow conditions
  const hasOverflow = height > MAX_BLOCK_HEIGHT || content.length > MAX_CONTENT_LENGTH;

  return {
    minWidth,
    idealWidth,
    height,
    lineCount,
    hasOverflow,
    font,
  };
}

/**
 * Quick measurement for content previews (truncated at first overflow).
 * Returns faster results for long content by sampling first N characters.
 */
export function measureBlockPreview(
  content: string,
  font: string = DEFAULT_FONT,
  maxWidth: number = IDEAL_READING_WIDTH,
  maxLines: number = 10
): BlockMetrics {
  const previewLength = 1000; // Sample size for preview
  const previewContent = content.length > previewLength
    ? content.slice(0, previewLength) + '…'
    : content;

  const metrics = measureBlock(previewContent, font, maxWidth);
  
  // Cap line count for preview
  if (metrics.lineCount > maxLines) {
    const lineHeight = 1.6 * 14; // approximate
    return {
      ...metrics,
      lineCount: maxLines,
      height: maxLines * lineHeight,
      hasOverflow: true,
    };
  }

  return { ...metrics, hasOverflow: content.length > previewLength };
}

/**
 * Measure multiple blocks efficiently with shared font preparation.
 * Useful for virtualized lists where font is constant.
 */
export function measureBlocksBatch(
  contents: string[],
  font: string = DEFAULT_FONT,
  maxWidth: number = IDEAL_READING_WIDTH
): BlockMetrics[] {
  return contents.map(content => measureBlock(content, font, maxWidth));
}

/**
 * Calculate total canvas height for a collection of blocks.
 * Includes spacing between blocks.
 */
export function calculateCanvasHeight(
  metrics: BlockMetrics[],
  spacing: number = 16,
  padding: number = 24
): number {
  const contentHeight = metrics.reduce((sum, m) => sum + m.height, 0);
  const spacingHeight = Math.max(0, metrics.length - 1) * spacing;
  return padding * 2 + contentHeight + spacingHeight;
}

/**
 * Determine optimal column width for kanban-style layouts.
 * Balances content width against container constraints.
 */
export function calculateOptimalColumnWidth(
  allMetrics: BlockMetrics[],
  containerWidth: number,
  columnCount: number,
  minColumnWidth: number = 280
): number {
  const maxContentWidth = Math.max(...allMetrics.map(m => m.minWidth));
  const availableWidth = (containerWidth - (columnCount - 1) * 16) / columnCount;
  
  return Math.max(
    minColumnWidth,
    Math.min(maxContentWidth + 48, availableWidth) // +48 for padding
  );
}
