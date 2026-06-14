import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, fireEvent, act } from '@testing-library/svelte';
import CommandPalette from './CommandPalette.svelte';

const sampleCommands = [
  {
    id: 'grove.invite',
    path: ['grove', 'invite'],
    description: 'Invite a user to the grove',
    parameters: [
      { name: 'user', description: 'User to invite', required: true, paramType: 'user' as const },
      { name: 'role', description: 'Role to assign', required: false, paramType: 'string' as const },
    ],
    requiredCapabilities: ['grove.manage'],
    contexts: ['grove' as const],
  },
  {
    id: 'agent.mode',
    path: ['agent', 'mode'],
    description: 'Switch agent mode',
    parameters: [
      { name: 'mode', description: 'Mode name', required: true, paramType: 'choice' as const, choices: ['fast', 'deep'] },
    ],
    requiredCapabilities: [],
    contexts: ['agent' as const],
  },
  {
    id: 'task.create',
    path: ['task', 'create'],
    description: 'Create a new task',
    parameters: [
      { name: 'title', description: 'Task title', required: true, paramType: 'string' as const },
    ],
    requiredCapabilities: ['task.write'],
    contexts: ['global' as const],
  },
];

function renderPalette(props: Record<string, unknown> = {}) {
  return render(CommandPalette, {
    props: {
      commands: sampleCommands,
      context: { realmId: 'r1' },
      onExecute: vi.fn().mockResolvedValue({ success: true, message: 'Done' }),
      onClose: vi.fn(),
      ...props,
    },
  });
}

async function openPalette(container: HTMLElement) {
  await fireEvent.keyDown(window, { key: '/' });
}

describe('CommandPalette', () => {
  afterEach(() => cleanup());

  it('does not render when closed', () => {
    const { container } = renderPalette();
    expect(container.querySelector('.command-palette')).toBeNull();
  });

  it('renders the palette container when open', async () => {
    const { container } = renderPalette();
    await openPalette(container);
    expect(container.querySelector('.command-palette')).not.toBeNull();
  });

  it('has role="dialog" on the palette container', async () => {
    const { container } = renderPalette();
    await openPalette(container);
    expect(container.querySelector('.command-palette')!.getAttribute('role')).toBe('dialog');
  });

  it('shows the command list with commands when open', async () => {
    const { container } = renderPalette();
    await openPalette(container);
    expect(container.querySelectorAll('[role="option"]').length).toBe(3);
  });

  it('renders command list with role="listbox"', async () => {
    const { container } = renderPalette();
    await openPalette(container);
    expect(container.querySelector('[role="listbox"]')).not.toBeNull();
  });

  it('renders each command option with role="option"', async () => {
    const { container } = renderPalette();
    await openPalette(container);
    const options = container.querySelectorAll('[role="option"]');
    expect(options.length).toBe(3);
  });

  it('clicking a command selects it and shows parameter chips', async () => {
    const { container } = renderPalette();
    await openPalette(container);
    const options = container.querySelectorAll('[role="option"]');
    await fireEvent.click(options[0]);
    expect(container.querySelectorAll('.param-chip').length).toBe(2);
  });

  it('shows parameter chips for the active command', async () => {
    const { container } = renderPalette();
    await openPalette(container);
    await fireEvent.click(container.querySelectorAll('[role="option"]')[0]);
    const chips = container.querySelectorAll('.param-chip');
    expect(chips[0].textContent).toContain('user');
    expect(chips[1].textContent).toContain('role');
  });

  it('displays keyboard help text', async () => {
    const { container } = renderPalette();
    await openPalette(container);
    const help = container.querySelector('.help');
    expect(help).not.toBeNull();
    expect(help!.textContent).toContain('Enter');
    expect(help!.textContent).toContain('Esc');
  });

  it('calls onClose when Escape is pressed in browse mode', async () => {
    const handleClose = vi.fn();
    const { container } = renderPalette({ onClose: handleClose });
    await openPalette(container);
    await fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('shows commands when open in browse mode', async () => {
    const { container } = renderPalette();
    await openPalette(container);
    const options = container.querySelectorAll('[role="option"]');
    expect(options.length).toBe(3);
  });

  it('marks required parameters with the required class', async () => {
    const { container } = renderPalette();
    await openPalette(container);
    await fireEvent.click(container.querySelectorAll('[role="option"]')[0]);
    const chips = container.querySelectorAll('.param-chip');
    expect(chips[0].classList.contains('required')).toBe(true);
  });

  it('marks the current parameter with the current class', async () => {
    const { container } = renderPalette();
    await openPalette(container);
    await fireEvent.click(container.querySelectorAll('[role="option"]')[0]);
    const chips = container.querySelectorAll('.param-chip');
    expect(chips[0].classList.contains('current')).toBe(true);
  });

  it('marks a filled parameter with the filled class', async () => {
    const { container } = renderPalette();
    await openPalette(container);
    await fireEvent.click(container.querySelectorAll('[role="option"]')[0]);
    const input = container.querySelector('input')!;
    await fireEvent.input(input, { target: { value: 'alice' } });
    await fireEvent.keyDown(input, { key: 'Enter' });
    const chips = container.querySelectorAll('.param-chip');
    expect(chips[0].classList.contains('filled')).toBe(true);
  });

  it('shows success feedback after successful command execution', async () => {
    const handleExecute = vi.fn().mockResolvedValue({ success: true, message: 'Invited!' });
    const { container } = renderPalette({ onExecute: handleExecute });
    await openPalette(container);
    await fireEvent.click(container.querySelectorAll('[role="option"]')[0]);
    const input = container.querySelector('input')!;
    await fireEvent.input(input, { target: { value: 'alice' } });
    await fireEvent.keyDown(input, { key: 'Enter' });
    await new Promise(r => setTimeout(r, 50));
    const feedback = container.querySelector('.feedback');
    expect(feedback).not.toBeNull();
    expect(feedback!.classList.contains('success')).toBe(true);
    expect(feedback!.textContent).toBe('Invited!');
  });

  it('shows error feedback after failed command execution', async () => {
    const handleExecute = vi.fn().mockResolvedValue({ success: false, message: 'No permission' });
    const { container } = renderPalette({ onExecute: handleExecute });
    await openPalette(container);
    await fireEvent.click(container.querySelectorAll('[role="option"]')[0]);
    const input = container.querySelector('input')!;
    await fireEvent.input(input, { target: { value: 'alice' } });
    await fireEvent.keyDown(input, { key: 'Enter' });
    await new Promise(r => setTimeout(r, 50));
    const feedback = container.querySelector('.feedback');
    expect(feedback).not.toBeNull();
    expect(feedback!.classList.contains('error')).toBe(true);
    expect(feedback!.textContent).toBe('No permission');
  });

  it('selects a command on Enter key in browse mode', async () => {
    const { container } = renderPalette();
    await openPalette(container);
    const options = container.querySelectorAll('[role="option"]');
    await fireEvent.keyDown(options[0], { key: 'Enter' });
    expect(container.querySelectorAll('.param-chip').length).toBe(2);
  });

  it('has aria-label on the dialog', async () => {
    const { container } = renderPalette();
    await openPalette(container);
    expect(container.querySelector('.command-palette')!.getAttribute('aria-label')).toBe('Command palette');
  });

  it('has aria-selected on command options', async () => {
    const { container } = renderPalette();
    await openPalette(container);
    const options = container.querySelectorAll('[role="option"]');
    expect(options[0].getAttribute('aria-selected')).toBe('true');
    expect(options[1].getAttribute('aria-selected')).toBe('false');
  });

  it('renders the slash prefix in browse mode', async () => {
    const { container } = renderPalette();
    await openPalette(container);
    expect(container.querySelector('.slash')).not.toBeNull();
  });

  it('renders command prefix when a command is active', async () => {
    const { container } = renderPalette();
    await openPalette(container);
    await fireEvent.click(container.querySelectorAll('[role="option"]')[0]);
    expect(container.querySelector('.command-prefix')).not.toBeNull();
    expect(container.querySelector('.command-prefix')!.textContent).toBe('/grove,invite');
  });
});
