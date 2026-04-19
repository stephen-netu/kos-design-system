<script lang="ts">
  import { 
    Button, Input, Card, Badge, Avatar, Toggle, Dropdown, Tooltip, Tabs, Spinner,
    FormField, SearchBar, KanbanCard, KanbanColumn, KanbanBoard,
    WorkspaceLayout, ChatViewLayout, KanbanViewLayout
  } from '../index.js';
  import { CheckpointBar } from '../d0-data-viz';
  import type { Checkpoint } from '../d0-data-viz/checkpoint-types';
  import { Search, Plus, Settings, MessageSquare, Bell, Moon, Sun, ArrowRight, Smile, MoreHorizontal, PenLine, Trash2 } from '@lucide/svelte';

  let isDarkTheme = $state(true);
  
  $effect(() => {
    document.documentElement.setAttribute('data-theme', isDarkTheme ? 'dark' : 'light');
  });

  // Example state for showcase
  let isSidebarCollapsed = $state(false);
  let isContextPanelOpen = $state(false);
  let activeTab = $state('components');
  let inputValue = $state('');
  let toggleChecked = $state(true);
  
  const demoTabs = [
    { id: 'components', label: 'Atomic Components' },
    { id: 'molecules', label: 'Molecules' },
    { id: 'organisms', label: 'Organisms & Layouts' },
    { id: 'dataviz', label: 'Data Viz' }
  ];

  // Demo checkpoints for CheckpointBar
  const demoCheckpoints: Checkpoint[] = [
    { seqno: 1, id: 'genesis', component: 'system-init', componentType: 'system-snapshot', status: 'committed', description: 'System initialization', timestamp: 1712000000000 },
    { seqno: 23, id: 'cp-23', component: 'leap-shell', componentType: 'ui-bundle', status: 'committed', description: 'Add navigation rail', version: { from: '0.1.0', to: '0.2.0' }, author: 'agent-cascade', timestamp: 1713000000000 },
    { seqno: 42, id: 'cp-42', component: 'sovereign-kernel', componentType: 'rust-crate', status: 'system', description: 'Kernel security patch', author: 'netu', timestamp: 1714000000000 },
    { seqno: 78, id: 'cp-78', component: 'agora-voice', componentType: 'ui-bundle', status: 'committed', description: 'Voice channel UI', version: { from: '1.0.0', to: '1.1.0' }, author: 'agent-ryu', timestamp: 1715000000000 },
    { seqno: 102, id: 'cp-102', component: 'substrate-daemon', componentType: 'substrate-binary', status: 'committed', description: 'Daemon auto-restart', author: 'netu', timestamp: 1716000000000 },
    { seqno: 156, id: 'cp-156', component: 'realm-config', componentType: 'config', status: 'proposed', description: 'New governance rules', author: 'agent-plex', timestamp: 1717000000000 },
  ];
  let demoCurrentSeqno = $state(78);
  let demoPreviewSeqno = $state<number | null>(null);

  const dropdownItems = [
    { id: '1', label: 'Edit Profile', shortcut: '⌘E' },
    { id: '2', label: 'Preferences', shortcut: '⌘,' },
    { id: '3', label: 'Log out', danger: true }
  ];
</script>

<div class="showcase ds-stack">
  <div class="showcase-header">
    <div class="ds-cluster">
      <h1>KOS Design System</h1>
      <Badge color="accent" variant="status">v1.0.0</Badge>
    </div>
    <div class="ds-cluster">
      <Toggle bind:checked={isDarkTheme} size="sm">
        {#snippet label()}
          <span>{isDarkTheme ? 'Dark' : 'Light'}</span>
        {/snippet}
      </Toggle>
    </div>
  </div>

  <Tabs tabs={demoTabs} bind:activeId={activeTab} />

  <div class="showcase-content">
    
    <!-- ATOMIC COMPONENTS -->
    {#if activeTab === 'components'}
      <section class="ds-stack" style="gap: var(--space-8)">
        
        <div class="component-section">
          <h3>Buttons</h3>
          <div class="demo-row">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="primary" loading>Loading</Button>
            <Button variant="primary" size="sm">Small</Button>
            <Button variant="primary" size="lg">Large</Button>
            <Button variant="secondary">
              {#snippet iconLeading()} <Plus size={16}/> {/snippet}
              With Icon
            </Button>
          </div>
        </div>

        <div class="component-section">
          <h3>Inputs & Forms</h3>
          <div class="demo-row" style="max-width: 400px; display: flex; flex-direction: column;">
            <Input placeholder="Standard Input" bind:value={inputValue} />
            <Input placeholder="With leading icon">
              {#snippet iconLeading()} <Search size={16}/> {/snippet}
            </Input>
            <Input type="password" placeholder="Password input" />
            <Input error placeholder="Error state" />
            <Input disabled placeholder="Disabled state" />
          </div>
        </div>

        <div class="component-section">
          <h3>Cards</h3>
          <div class="demo-row">
            <Card variant="elevated">
              {#snippet header()} Elevated Card {/snippet}
              <p>Default card style for surfaces.</p>
            </Card>
            
            <Card variant="flat">
              {#snippet header()} Flat Card {/snippet}
              <p>Subtle border, no shadow.</p>
            </Card>

            <Card variant="interactive" selected>
              {#snippet header()} Interactive (Selected) {/snippet}
              <p>Hover and focus effects with accent ring.</p>
            </Card>

            <div class="glass-bg">
              <Card variant="glass">
                {#snippet header()} Glassmorphic {/snippet}
                <p>For overlays and floating elements over content.</p>
              </Card>
            </div>
          </div>
        </div>

        <div class="component-section">
          <h3>Badges & Avatars</h3>
          <div class="demo-row">
            <div class="ds-cluster">
              <Badge variant="status" color="accent">Active</Badge>
              <Badge variant="status" color="success">Paid</Badge>
              <Badge variant="status" color="warning">Pending</Badge>
              <Badge variant="status" color="error">Failed</Badge>
              <Badge variant="status" color="neutral">Draft</Badge>
            </div>
            
            <div class="ds-cluster">
              <Badge variant="count" color="accent">12</Badge>
              <Badge variant="count" color="error">3</Badge>
              <Badge variant="outline" color="info">Outline</Badge>
              <Badge variant="dot" color="success" />
            </div>

            <div class="ds-cluster" style="margin-left: var(--space-8)">
              <Avatar name="Netu" status="online" size="lg" />
              <Avatar name="System Architect" status="typing" />
              <Avatar name="Bot Agent" status="offline" size="sm" />
            </div>
          </div>
        </div>

        <div class="component-section">
          <h3>Interactive Atoms</h3>
          <div class="demo-row">
            <Toggle bind:checked={toggleChecked} />
            
            <Dropdown items={dropdownItems}>
              {#snippet trigger()}
                <Button variant="secondary">Open Menu</Button>
              {/snippet}
            </Dropdown>

            <Tooltip content="This is a helpful tooltip!">
              {#snippet trigger()}
                <Badge variant="outline" color="accent">Hover me</Badge>
              {/snippet}
            </Tooltip>

            <Spinner size="lg" color="accent" />
          </div>
        </div>
      </section>
    {/if}

    <!-- MOLECULES -->
    {#if activeTab === 'molecules'}
      <section class="ds-stack" style="gap: var(--space-8)">
        
        <div class="component-section">
          <h3>Form Field & Search</h3>
          <div class="demo-row" style="flex-direction: column; max-width: 400px;">
            <FormField id="demo-field" label="Email Address" helper="We'll never share your email.">
              <Input id="demo-field" type="email" placeholder="agent@kos.network" />
            </FormField>
            
            <FormField id="demo-err" label="Username" error="This username is taken.">
              <Input id="demo-err" error value="sovra_admin" />
            </FormField>

            <SearchBar placeholder="Search globally..." />
          </div>
        </div>

        <!-- TODO: Re-add when Chat components exist
        <div class="component-section">
          <h3>List Items</h3>
          <div class="demo-row" style="flex-direction: column; max-width: 320px;">
            <ChannelListItem id="c1" name="general-chat" time="2m" unreadCount={5} preview="Hey, did we merge the PR?" />
            <ChannelListItem id="c2" name="architecture-req" isActive preview="Let's discuss the capability model." />
            <ChannelListItem id="c3" name="alerts-noisy" isMuted unreadCount={12} preview="[CRITICAL] Pod failure" />
          </div>
        </div>

        <div class="component-section">
          <h3>Message Bubbles</h3>
          <div class="demo-row" style="flex-direction: column; max-width: 500px">
            <MessageBubble id="m1" senderName="Alice" timestamp={Date.now() - 60000} content="..." />
          </div>
        </div>
        -->

        <div class="component-section">
          <h3>Kanban Card</h3>
          <div class="demo-row">
            <div style="width: 280px">
              <KanbanCard item={{
                id: '1', title: 'Implement Design Tokens', priority: 'high',
                content: 'Add full css variable support to all atomic components.',
                badges: [{ label: 'Frontend', color: 'accent' }],
                assignee: { name: 'Netu' }
              }} />
            </div>
          </div>
        </div>
      </section>
    {/if}
    <!-- ORGANISMS & LAYOUTS -->
    {#if activeTab === 'organisms'}
      <section class="ds-stack" style="gap: var(--space-8)">
        
        <!-- TODO: Re-add when ContextPanel component exists
        <div class="component-section">
          <h3>Context Panel</h3>
          <div style="height: 300px; position: relative; border: 1px solid var(--border-default); overflow: hidden; border-radius: var(--radius-lg, 8px);">
            <div style="padding: 20px;">
              <Button onclick={() => isContextPanelOpen = true}>Open Panel</Button>
            </div>
            <ContextPanel bind:isOpen={isContextPanelOpen} title="Task Details" tabs={[]}>
              <div class="ds-stack">
                <KanbanCard item={{id:'x', title:'Sample Task', priority:'urgent'}} />
              </div>
            </ContextPanel>
          </div>
        </div>
        -->

        <div class="component-section">
          <h3>Kanban Board</h3>
          <div style="height: 400px; border: 1px solid var(--border-default); border-radius: var(--radius-lg, 8px);">
            <KanbanBoard>
              <KanbanColumn id="todo" title="To Do" count={2}>
                <KanbanCard item={{id:'t1', title:'Setup repo', priority:'high'}} />
                <KanbanCard item={{id:'t2', title:'Config vite', priority:'medium'}} />
              </KanbanColumn>
              
              <KanbanColumn id="inprog" title="In Progress" count={1} wipLimit={3}>
                <KanbanCard item={{id:'t3', title:'Build components', priority:'high'}} />
              </KanbanColumn>

              <KanbanColumn id="done" title="Done" count={0} />
            </KanbanBoard>
          </div>
        </div>

        <!-- TODO: Re-add when ChatPanel and CanvasToolbar components exist
        <div class="component-section">
          <h3>Chat Panel (Organism)</h3>
          <div style="height: 500px; border: 1px solid var(--border-default); border-radius: var(--radius-lg, 8px);">
            <ChatPanel title="general-chat" memberCount={42}>
              {#snippet headerActions()}<Button variant="ghost" size="sm"><Search size={16}/></Button>{/snippet}
              {#snippet messages()}<p>Messages here</p>{/snippet}
              {#snippet composer()}<Input placeholder="Message..." />{/snippet}
            </ChatPanel>
          </div>
        </div>

        <div class="component-section">
          <h3>Canvas Toolbar</h3>
          <div style="height: 200px; position: relative; background: var(--color-bg-canvas);">
            <CanvasToolbar position="bottom">
              <Button variant="ghost"><Settings size={16}/></Button>
            </CanvasToolbar>
          </div>
        </div>
        -->
      </section>
    {/if}

    <!-- DATA VIZ -->
    {#if activeTab === 'dataviz'}
      <section class="ds-stack" style="gap: var(--space-8)">
        <div class="component-section">
          <h3>CheckpointBar — Timeline Navigation</h3>
          <p style="color: var(--color-text-secondary); margin-bottom: 1rem;">
            ADR: ui-timeline-checkpoint-bar-001 — Scrollable checkpoint navigation with color-coded components.
          </p>
          <div style="border: 1px solid var(--border-default); border-radius: var(--radius-lg, 8px); overflow: hidden;">
            <CheckpointBar
              checkpoints={demoCheckpoints}
              currentSeqno={demoCurrentSeqno}
              previewSeqno={demoPreviewSeqno}
              onCheckpointClick={(cp) => { demoPreviewSeqno = cp.seqno; }}
              onCheckpointDoubleClick={(cp) => { alert(`Rollback to checkpoint ${cp.seqno}?`); }}
            />
          </div>
          <div style="margin-top: 1rem; padding: 1rem; background: var(--color-bg-panel); border-radius: var(--radius-md);">
            <p style="font-size: 0.85rem; color: var(--color-text-muted);">
              <strong>Interactions:</strong> Hover for tooltip, Click to preview, Double-click to rollback, Arrow keys to navigate
            </p>
            <p style="font-size: 0.85rem; color: var(--color-text-muted); margin-top: 0.5rem;">
              <strong>Current:</strong> {demoCurrentSeqno} |
              <strong>Preview:</strong> {demoPreviewSeqno ?? 'None'} |
              <button onclick={() => demoPreviewSeqno = null}>Exit Preview</button>
            </p>
          </div>
        </div>

        <div class="component-section">
          <h3>Component Color Coding</h3>
          <div class="demo-row">
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
              {#each Object.entries({ 'rust-crate': '#b87333', 'ui-bundle': '#5f9ea0', 'config': '#daa520', 'faculty-state': '#9370db', 'substrate-binary': '#cd5c5c', 'system-snapshot': '#2f4f4f' }) as [type, color]}
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <span style="color: {color}; font-size: 16px;">◉</span>
                  <span style="font-size: 0.85rem; color: var(--color-text-secondary); font-family: var(--font-mono);">{type}</span>
                  <span style="font-size: 0.75rem; color: var(--color-text-muted);">{color}</span>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </section>
    {/if}

  </div>
</div>

<style>
  .showcase {
    padding: var(--space-8);
    max-width: 1200px;
    margin: 0 auto;
    font-family: var(--font-sans);
    color: var(--color-text-primary);
  }

  .showcase-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-6);
  }

  h1 {
    margin: 0;
    font-size: var(--text-2xl);
    background: linear-gradient(135deg, var(--color-accent) 0%, #E2A670 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  h3 {
    margin: 0 0 var(--space-4) 0;
    font-weight: 500;
    color: var(--color-text-secondary);
    border-bottom: 1px solid var(--border-subtle);
    padding-bottom: var(--space-2);
  }

  .showcase-content {
    margin-top: var(--space-6);
  }

  .component-section {
    display: flex;
    flex-direction: column;
  }

  .demo-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-4);
    align-items: flex-end;
  }

  .ds-cluster {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .glass-bg {
    padding: var(--space-4);
    background: linear-gradient(135deg, #FF6B6B, #4ECDC4);
    border-radius: var(--radius-lg);
  }
</style>
