// L0 Layout — Pure Layout → CSS custom-property string mapping
// No inline literals — all values exposed as CSS custom properties.

import type { Layout, LayoutAlign, LayoutDirection, LayoutSizing } from './types';

const ALIGN_MAP: Record<LayoutAlign, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
};

function directionToFlex(direction: LayoutDirection): string {
  return direction === 'row' ? 'row' : 'column';
}

function alignToCss(value: LayoutAlign): string {
  return ALIGN_MAP[value];
}

/**
 * Row: align → align-items, childAlignment → justify-content
 * Column: align → justify-content, childAlignment → align-items
 */
function mainCrossAlign(
  direction: LayoutDirection,
  align: LayoutAlign,
  childAlignment: LayoutAlign,
): { main: string; cross: string } {
  if (direction === 'row') {
    return { main: alignToCss(childAlignment), cross: alignToCss(align) };
  }
  return { main: alignToCss(align), cross: alignToCss(childAlignment) };
}

function sizingToVars(sizing: LayoutSizing): Record<string, string> {
  if (sizing === 'fit') {
    return {
      '--layout-flex-basis': 'auto',
      '--layout-flex-grow': '0',
      '--layout-flex-shrink': '1',
    };
  }
  if (sizing === 'grow') {
    return {
      '--layout-flex-basis': '0%',
      '--layout-flex-grow': '1',
      '--layout-flex-shrink': '1',
    };
  }
  if (sizing === 'fixed') {
    return {
      '--layout-flex-basis': 'auto',
      '--layout-flex-grow': '0',
      '--layout-flex-shrink': '0',
    };
  }
  // { min, max }
  return {
    '--layout-flex-basis': 'auto',
    '--layout-flex-grow': '0',
    '--layout-flex-shrink': '1',
    '--layout-min-width': `${sizing.min}px`,
    '--layout-max-width': `${sizing.max}px`,
  };
}

export function layoutToStyle(layout: Layout): string {
  const { main, cross } = mainCrossAlign(
    layout.direction,
    layout.align,
    layout.childAlignment,
  );

  const sizing = sizingToVars(layout.sizing);

  const vars: string[] = [
    `--layout-direction: ${directionToFlex(layout.direction)}`,
    `--layout-gap: ${layout.gap}px`,
    `--layout-padding-top: ${layout.padding.top}px`,
    `--layout-padding-right: ${layout.padding.right}px`,
    `--layout-padding-bottom: ${layout.padding.bottom}px`,
    `--layout-padding-left: ${layout.padding.left}px`,
    `--layout-justify-content: ${main}`,
    `--layout-align-items: ${cross}`,
    ...Object.entries(sizing).map(([k, v]) => `${k}: ${v}`),
  ];

  return vars.join('; ');
}
