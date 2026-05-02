// U0 Primitives — Atomic UI components

export { default as Button } from './button/Button.svelte';
export { default as Input } from './input/Input.svelte';
export { default as Card } from './card/Card.svelte';
export { default as Badge } from './badge/Badge.svelte';
export { default as Avatar } from './avatar/Avatar.svelte';
export { default as Toggle } from './toggle/Toggle.svelte';
export { default as Tooltip } from './tooltip/Tooltip.svelte';
export { default as Dropdown } from './dropdown/Dropdown.svelte';
export { default as Tabs } from './tabs/Tabs.svelte';
export type { Tab } from './tabs/tabs-types';
export { default as Spinner } from './spinner/Spinner.svelte';
export { default as Modal } from './modal/Modal.svelte';
export { default as AnimatedIcon } from './animated-icon/AnimatedIcon.svelte';
export type { AnimatedIconName, AnimationType } from './animated-icon/index.js';
export * from './assay-badge/index.js';
export * from './allay-gauge/index.js';
export * from './expert-badge/index.js';

// New from NNJAS port
export { default as VerticalToolbar } from './VerticalToolbar.svelte';
export { default as AccordionSection } from './AccordionSection.svelte';
export { default as LockIndicator } from './LockIndicator.svelte';
export type { ToolbarItem } from './VerticalToolbar.svelte';
export type { AccordionSectionProps } from './AccordionSection.svelte';
export type { LockUser, LockState } from './LockIndicator.svelte';

// RSVP Speed Reading
export { default as RsvpReader } from './rsvp/RsvpReader.svelte';
export * from './rsvp/rsvp-utils';

// Command Palette — Slash commands for LEAP chat
export { CommandPalette, commandStore } from './command-palette';
export type {
  CommandSchema,
  CommandParameter,
  CommandResult,
  CommandContext,
  InvocationContext,
  CommandUIState,
  ActiveCommandSession,
} from './command-palette';

// Re-export types
export type {
  ButtonProps,
  InputProps,
  CardProps,
  BadgeProps,
  ToggleProps,
  SpinnerProps,
  TabsProps,
  ModalProps,
  TooltipProps,
  DropdownProps,
  DropdownItem,
  AvatarProps,
} from '../p0-primitives/types';
