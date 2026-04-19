// Shared type definitions for the design system
// These types mirror the actual Props interfaces in each component.
// Keep in sync with component $props() definitions.

export * from './plugin-types';

import type { Snippet } from 'svelte';

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  class?: string;
  onclick?: (e: MouseEvent) => void;
  children?: Snippet;
  iconLeading?: Snippet;
  iconTrailing?: Snippet;
}

export interface InputProps {
  value?: string;
  type?: 'text' | 'search' | 'password' | 'email' | 'url';
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  class?: string;
  id?: string;
  name?: string;
  iconLeading?: Snippet;
  iconTrailing?: Snippet;
}

export interface CardProps {
  variant?: 'elevated' | 'flat' | 'interactive' | 'glass';
  selected?: boolean;
  class?: string;
  onclick?: (e: MouseEvent) => void;
  onkeydown?: (e: KeyboardEvent) => void;
  children?: Snippet;
  header?: Snippet;
  footer?: Snippet;
}

export interface BadgeProps {
  variant?: 'status' | 'count' | 'dot' | 'outline';
  color?: 'accent' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  class?: string;
  children?: Snippet;
}

export interface ToggleProps {
  checked?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  class?: string;
  onchange?: (checked: boolean) => void;
  label?: Snippet;
}

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'accent' | 'muted' | 'white';
  class?: string;
}

export interface TabsProps {
  tabs: Array<{ id: string; label: string | Snippet; disabled?: boolean; icon?: Snippet }>;
  activeId?: string;
  class?: string;
  fullWidth?: boolean;
  onchange?: (id: string) => void;
}

export interface ModalProps {
  isOpen?: boolean;
  title?: string;
  class?: string;
  onClose?: () => void;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  zIndex?: number;
  children?: Snippet;
  headerActions?: Snippet;
  footer?: Snippet;
}

export interface TooltipProps {
  content: string | Snippet;
  position?: 'top' | 'right' | 'bottom' | 'left';
  delayMs?: number;
  class?: string;
  trigger: Snippet;
}

export interface DropdownItem {
  id: string;
  label: string;
  icon?: Snippet;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
}

export interface DropdownProps {
  items: DropdownItem[];
  trigger: Snippet;
  align?: 'left' | 'right' | 'center';
  width?: string;
  class?: string;
  onselect?: (item: DropdownItem) => void;
}

export interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'away' | 'busy' | 'typing' | null;
  class?: string;
}
