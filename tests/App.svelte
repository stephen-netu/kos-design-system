<script lang="ts">
  import Button from '../src/u0-primitives/button/Button.svelte';
  import Card from '../src/u0-primitives/card/Card.svelte';
  import ThemeProvider from '../src/p0-primitives/ThemeProvider.svelte';
  import Badge from '../src/u0-primitives/badge/Badge.svelte';
  import Spinner from '../src/u0-primitives/spinner/Spinner.svelte';
  import Steps from '../src/u0-primitives/steps/Steps.svelte';
  import Input from '../src/u0-primitives/input/Input.svelte';
  import Toggle from '../src/u0-primitives/toggle/Toggle.svelte';
  import Tabs from '../src/u0-primitives/tabs/Tabs.svelte';
  import Accordion from '../src/u0-primitives/accordion/Accordion.svelte';
  import Modal from '../src/u0-primitives/modal/Modal.svelte';
  import Dropdown from '../src/u0-primitives/dropdown/Dropdown.svelte';
  import Tooltip from '../src/u0-primitives/tooltip/Tooltip.svelte';
  import Avatar from '../src/u0-primitives/avatar/Avatar.svelte';
  import type { Tab } from '../src/u0-primitives/tabs/tabs-types';
  import type { DropdownItem } from '../src/u0-primitives/dropdown/Dropdown.svelte';

  let modalOpen = $state(false);
  let inputValue = $state('');
  let toggleChecked = $state(false);
  let toggleCheckedMd = $state(false);

  const tabsData: Tab[] = [
    { id: 'tab1', label: 'Overview' },
    { id: 'tab2', label: 'Settings' },
    { id: 'tab3', label: 'Disabled', disabled: true },
  ];

  const dropdownItems: DropdownItem[] = [
    { id: 'item1', label: 'New File' },
    { id: 'item2', label: 'Open', disabled: true },
    { id: 'item3', label: 'Save' },
    { id: 'item4', label: 'Delete', danger: true },
  ];

  const steps = [
    { label: 'Account', description: 'Create account', completed: true },
    { label: 'Profile', description: 'Fill profile', completed: true, active: true },
    { label: 'Complete', description: 'Finish setup', completed: false },
  ];

  const accordionPanels = [
    { id: 'p1', title: 'What is KOS?', content: () => 'Kernel Operating Substrate' },
    { id: 'p2', title: 'How does it work?', content: () => 'Through capability mediation' },
    { id: 'p3', title: 'Why sovereignty?', content: () => 'Deterministic, auditable compute' },
  ];

  const accordionSinglePanels = [
    { id: 'sp1', title: 'Single Panel 1', content: () => 'Content 1' },
    { id: 'sp2', title: 'Single Panel 2', content: () => 'Content 2' },
  ];
</script>

<ThemeProvider>
  <main class="ds-stack ds-stack-4" style="padding: 2rem;">
    <h2>Button</h2>
    <div class="ds-flex ds-flex-row ds-flex-wrap ds-stack-2">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
      <Button disabled>Disabled</Button>
      <Button loading>Loading</Button>
    </div>

    <h2>Card</h2>
    <div class="ds-flex ds-flex-row ds-flex-wrap ds-stack-3">
      <Card style="width: 300px;">
        {#snippet header()}
          <span>Elevated Card</span>
        {/snippet}
        <p>Default elevated card content</p>
      </Card>

      <Card variant="flat" style="width: 300px;">
        {#snippet header()}
          <span>Flat Card</span>
        {/snippet}
        <p>Flat variant — inset panel</p>
      </Card>

      <Card variant="interactive" style="width: 300px;">
        {#snippet header()}
          <span>Interactive Card</span>
        {/snippet}
        <p>Click me</p>
      </Card>

      <Card variant="glass" style="width: 300px;">
        {#snippet header()}
          <span>Glass Card</span>
        {/snippet}
        <p>Glassmorphic panel</p>
      </Card>

      <Card variant="metal" style="width: 300px;">
        {#snippet header()}
          <span>Metal Card</span>
        {/snippet}
        <p>Brushed metal gradient</p>
      </Card>

      <Card variant="hazard" style="width: 300px;">
        {#snippet header()}
          <span>Hazard Card</span>
        {/snippet}
        <p>Warning panel — brass accent</p>
      </Card>

      <Card selected style="width: 300px;">
        {#snippet header()}
          <span>Selected Card</span>
        {/snippet}
        <p>Selected state with brass ring</p>
      </Card>
    </div>

    <h2>Button Sizes</h2>
    <div class="ds-flex ds-flex-row ds-items-center ds-stack-2">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>

    <h2>Theme Overrides</h2>
    <ThemeProvider theme={{ colorAcccent: '#6b8e23' } as any}>
      <Button variant="primary">Custom Accent</Button>
    </ThemeProvider>

    <!-- ─── Badge ─────────────────────────────────────────── -->
    <h2>Badge</h2>
    <div class="ds-flex ds-flex-row ds-flex-wrap ds-stack-2">
      <Badge variant="status" color="accent">Accent</Badge>
      <Badge variant="status" color="success">Success</Badge>
      <Badge variant="status" color="warning">Warning</Badge>
      <Badge variant="status" color="error">Error</Badge>
      <Badge variant="status" color="info">Info</Badge>
      <Badge variant="status" color="neutral">Neutral</Badge>
    </div>
    <div class="ds-flex ds-flex-row ds-flex-wrap ds-stack-2">
      <Badge variant="count" color="accent">3</Badge>
      <Badge variant="outline" color="accent">Outline</Badge>
      <Badge variant="dot" color="success"></Badge>
      <Badge variant="status" color="accent" size="sm">Small</Badge>
      <Badge variant="status" color="accent" size="lg">Large</Badge>
      <Badge variant="status" color="accent" count={99}>99+</Badge>
    </div>

    <!-- ─── Spinner ───────────────────────────────────────── -->
    <h2>Spinner</h2>
    <div class="ds-flex ds-flex-row ds-items-center ds-stack-3">
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" />
      <Spinner size="xl" />
      <Spinner size="md" color="muted" />
      <Spinner size="md" color="white" />
    </div>

    <!-- ─── Steps ─────────────────────────────────────────── -->
    <h2>Steps</h2>
    <Steps {steps} />

    <!-- ─── Input ─────────────────────────────────────────── -->
    <h2>Input</h2>
    <div style="max-width: 300px;">
      <Input bind:value={inputValue} placeholder="Default input" />
    </div>
    <div style="max-width: 300px;">
      <Input value="With error" error placeholder="Error input" />
    </div>
    <div style="max-width: 300px;">
      <Input value="Disabled" disabled placeholder="Disabled input" />
    </div>
    <div style="max-width: 300px;">
      <Input type="password" value="secret" placeholder="Password input" />
    </div>

    <!-- ─── Toggle ────────────────────────────────────────── -->
    <h2>Toggle</h2>
    <div class="ds-flex ds-flex-row ds-items-center ds-stack-3">
      <Toggle bind:checked={toggleChecked} size="sm">Small</Toggle>
      <Toggle bind:checked={toggleCheckedMd} size="md">Medium</Toggle>
      <Toggle checked size="lg">Large</Toggle>
      <Toggle disabled>Disabled</Toggle>
      <Toggle checked disabled>Disabled Checked</Toggle>
    </div>

    <!-- ─── Tabs ──────────────────────────────────────────── -->
    <h2>Tabs</h2>
    <Tabs tabs={tabsData} />

    <h2>Tabs Full Width</h2>
    <Tabs tabs={tabsData} fullWidth />

    <!-- ─── Accordion ─────────────────────────────────────── -->
    <h2>Accordion</h2>
    <Accordion panels={accordionPanels} />

    <h2>Accordion Single Open</h2>
    <Accordion panels={accordionSinglePanels} singleOpen />

    <!-- ─── Modal ─────────────────────────────────────────── -->
    <h2>Modal</h2>
    <Button onclick={() => modalOpen = true}>Open Modal</Button>
    <Modal isOpen={modalOpen} title="Test Modal" onClose={() => modalOpen = false}>
      <p>Modal content goes here</p>
    </Modal>

    <!-- ─── Dropdown ──────────────────────────────────────── -->
    <h2>Dropdown</h2>
    <Dropdown items={dropdownItems}>
      {#snippet trigger()}
        <button class="ds-button variant-secondary size-md" type="button">Open Menu</button>
      {/snippet}
    </Dropdown>

    <!-- ─── Tooltip ───────────────────────────────────────── -->
    <h2>Tooltip</h2>
    <div class="ds-flex ds-flex-row ds-flex-wrap ds-stack-3">
      <Tooltip content="Tooltip on top" position="top">
        {#snippet trigger()}
          <button class="ds-button variant-primary size-md">Top</button>
        {/snippet}
      </Tooltip>
      <Tooltip content="Tooltip on right" position="right">
        {#snippet trigger()}
          <button class="ds-button variant-primary size-md">Right</button>
        {/snippet}
      </Tooltip>
      <Tooltip content="Tooltip on bottom" position="bottom">
        {#snippet trigger()}
          <button class="ds-button variant-primary size-md">Bottom</button>
        {/snippet}
      </Tooltip>
      <Tooltip content="Tooltip on left" position="left">
        {#snippet trigger()}
          <button class="ds-button variant-primary size-md">Left</button>
        {/snippet}
      </Tooltip>
    </div>

    <!-- ─── Avatar ────────────────────────────────────────── -->
    <h2>Avatar</h2>
    <div class="ds-flex ds-flex-row ds-items-center ds-stack-3">
      <Avatar name="John Doe" size="sm" />
      <Avatar name="Jane Doe" size="md" />
      <Avatar name="Bob Smith" size="lg" />
      <Avatar name="Alice Lee" size="xl" />
      <Avatar name="Online User" size="md" status="online" />
      <Avatar name="Away User" size="md" status="away" />
      <Avatar name="Busy User" size="md" status="busy" />
      <Avatar name="Offline User" size="md" status="offline" />
      <Avatar name="Typing User" size="md" status="typing" />
    </div>
  </main>
</ThemeProvider>
