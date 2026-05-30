// Content-Proportional BSP — Zone sizing based on Pretext-measured content
// Zones split proportionally to their content area, not equally
// Tiny zones become "colored blocks" (indicators) when below minContentThreshold

import { measureBlock, type BlockMetrics } from '../x0-enchanted-blocks/core/block-layout.js';
import type { BspNode, ZoneLeaf, SplitDirection, ZoneTilerConfig } from './zone-tiler-types.js';

/** Content metadata attached to zones for proportional sizing */
export interface ContentZone {
  zone: ZoneLeaf;
  content: string;
  metrics?: BlockMetrics;
  /** Effective area (width × height) for split ratio calculation */
  contentArea: number;
  /** When true, zone renders as compact indicator block */
  isMinimized: boolean;
}

/** Configuration for content-proportional layout */
export interface ProportionalBspConfig extends ZoneTilerConfig {
  /** Minimum content area (px²) before zone becomes minimized block. Default: 10000 (100×100) */
  minContentThreshold?: number;
  /** Minimum zone dimension even for content-rich zones. Default: 80px */
  absoluteMinZoneSize?: number;
  /** Font for Pretext measurement. Default: system font */
  measureFont?: string;
  /** Max width constraint for content measurement. Default: 400px */
  maxContentWidth?: number;
}

/** Build a BSP tree with splits proportional to content areas */
export function buildProportionalBsp(
  zones: ContentZone[],
  direction: SplitDirection = 'horizontal',
  config: ProportionalBspConfig = {}
): BspNode {
  const { minContentThreshold = 10000 } = config;
  
  // Measure all content
  const measured = zones.map(z => ({
    ...z,
    metrics: measureBlock(z.content, config.measureFont, config.maxContentWidth),
  }));
  
  // Calculate content areas
  const withAreas = measured.map(z => {
    const area = z.metrics ? z.metrics.idealWidth * z.metrics.height : 0;
    return {
      ...z,
      contentArea: area,
      isMinimized: area < minContentThreshold,
    };
  });
  
  // Separate minimized blocks from full zones
  const fullZones = withAreas.filter(z => !z.isMinimized);
  const minimizedBlocks = withAreas.filter(z => z.isMinimized);
  
  if (fullZones.length === 0) {
    // All zones minimized — build equal BSP for colored blocks
    return buildEqualBsp(minimizedBlocks.map(z => z.zone), direction);
  }
  
  // Build proportional tree for full zones
  let tree = buildWeightedBsp(fullZones, direction);
  
  // Add minimized blocks as a separate region if any exist
  if (minimizedBlocks.length > 0) {
    const minimizedTree = buildEqualBsp(minimizedBlocks.map(z => z.zone), 
      direction === 'horizontal' ? 'vertical' : 'horizontal');
    
    // Split to add minimized region (small portion)
    tree = {
      kind: 'split',
      direction,
      ratio: 0.85, // 85% to full zones, 15% to minimized
      first: tree,
      second: minimizedTree,
    };
  }
  
  return tree;
}

/** Build BSP with splits weighted by content area */
function buildWeightedBsp(zones: ContentZone[], direction: SplitDirection): BspNode {
  if (zones.length === 0) {
    throw new Error('Cannot build BSP from empty zones');
  }
  if (zones.length === 1) {
    return zones[0].zone;
  }
  
  // Sort by content area descending
  const sorted = [...zones].sort((a, b) => b.contentArea - a.contentArea);
  const totalArea = sorted.reduce((sum, z) => sum + z.contentArea, 0);
  
  // Find split point that balances area on each side
  let accumulated = 0;
  let splitIndex = 0;
  const halfArea = totalArea / 2;
  
  for (let i = 0; i < sorted.length; i++) {
    accumulated += sorted[i].contentArea;
    if (accumulated >= halfArea) {
      splitIndex = i + 1;
      break;
    }
  }
  
  // Ensure at least one zone on each side
  splitIndex = Math.max(1, Math.min(splitIndex, sorted.length - 1));
  
  const firstGroup = sorted.slice(0, splitIndex);
  const secondGroup = sorted.slice(splitIndex);
  
  // Calculate split ratio based on area proportions
  const firstArea = firstGroup.reduce((sum, z) => sum + z.contentArea, 0);
  const ratio = firstArea / totalArea;
  
  // Recursively build subtrees
  const firstNode = firstGroup.length === 1 
    ? firstGroup[0].zone 
    : buildWeightedBsp(firstGroup, flipDirection(direction));
    
  const secondNode = secondGroup.length === 1
    ? secondGroup[0].zone
    : buildWeightedBsp(secondGroup, flipDirection(direction));
  
  return {
    kind: 'split',
    direction,
    ratio: Math.max(0.1, Math.min(0.9, ratio)), // Clamp between 10-90%
    first: firstNode,
    second: secondNode,
  };
}

/** Build equal-split BSP (for minimized blocks) */
function buildEqualBsp(zones: ZoneLeaf[], direction: SplitDirection): BspNode {
  if (zones.length === 0) {
    throw new Error('Cannot build BSP from empty zones');
  }
  if (zones.length === 1) {
    return zones[0];
  }
  
  const mid = Math.floor(zones.length / 2);
  const firstGroup = zones.slice(0, mid);
  const secondGroup = zones.slice(mid);
  
  const firstNode = firstGroup.length === 1
    ? firstGroup[0]
    : buildEqualBsp(firstGroup, flipDirection(direction));
    
  const secondNode = secondGroup.length === 1
    ? secondGroup[0]
    : buildEqualBsp(secondGroup, flipDirection(direction));
  
  return {
    kind: 'split',
    direction,
    ratio: 0.5,
    first: firstNode,
    second: secondNode,
  };
}

/** Alternate split direction */
function flipDirection(d: SplitDirection): SplitDirection {
  return d === 'horizontal' ? 'vertical' : 'horizontal';
}

/** Calculate zone sizing infographic data */
export function generateSizingInfographic(
  zones: ContentZone[],
  containerWidth: number,
  containerHeight: number,
  config: ProportionalBspConfig = {}
): SizingInfo[] {
  const { minContentThreshold = 10000 } = config;
  
  return zones.map(z => {
    const metrics = measureBlock(z.content, config.measureFont, config.maxContentWidth);
    const area = metrics.idealWidth * metrics.height;
    const isMinimized = area < minContentThreshold;
    
    // Calculate what fits
    const fits: string[] = [];
    if (metrics.lineCount >= 1) fits.push('Title');
    if (metrics.lineCount >= 3) fits.push('Preview');
    if (metrics.lineCount >= 8) fits.push('Full content');
    if (area > minContentThreshold) fits.push('Edit mode');
    
    return {
      zoneId: z.zone.id,
      contentArea: area,
      lines: metrics.lineCount,
      isMinimized,
      fits,
      recommendedSize: isMinimized ? '40×40' : `${Math.round(metrics.idealWidth)}×${Math.round(metrics.height)}`,
    };
  });
}

/** Infographic data for each zone */
export interface SizingInfo {
  zoneId: string;
  contentArea: number;
  lines: number;
  isMinimized: boolean;
  fits: string[];
  recommendedSize: string;
}

/**
 * Predict proportional split ratio based on actual content areas
 * Used to avoid static 50/50 splits
 */
export function calculateProportionalRatio(
  firstContent: string,
  secondContent: string,
  config: ProportionalBspConfig = {}
): number {
  const m1 = measureBlock(firstContent, config.measureFont, config.maxContentWidth);
  const m2 = measureBlock(secondContent, config.measureFont, config.maxContentWidth);
  
  const area1 = m1.idealWidth * m1.height;
  const area2 = m2.idealWidth * m2.height;
  
  if (area1 + area2 === 0) return 0.5;
  
  const ratio = area1 / (area1 + area2);
  return Math.max(0.1, Math.min(0.9, ratio));
}

import { splitZone } from './zone-tiler-types.js';

/** 
 * Split a leaf zone into two zones using text measurement to proportionalize the ratio 
 */
export function splitZoneProportional(
  root: BspNode,
  targetId: string,
  direction: SplitDirection,
  newZone: ZoneLeaf,
  targetContent: string,
  newZoneContent: string,
  config?: ProportionalBspConfig
): BspNode {
  const ratio = calculateProportionalRatio(targetContent, newZoneContent, config);
  return splitZone(root, targetId, direction, newZone, ratio);
}
