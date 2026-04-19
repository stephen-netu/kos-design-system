<script lang="ts">
  import type { Snippet } from 'svelte';
  
  interface Props {
    channelList?: Snippet; // E.g. Sidebar component tailored for channels
    chatThread: Snippet;   // E.g. ChatPanel organism
    memberList?: Snippet;  // E.g. ContextPanel showing right side members
    class?: string;
  }

  let {
    channelList,
    chatThread,
    memberList,
    class: className = ''
  }: Props = $props();
</script>

<div class="ds-chat-layout {className}">
  {#if channelList}
    <div class="ds-chat-layout-sidebar">
      {@render channelList()}
    </div>
  {/if}

  <main class="ds-chat-layout-main">
    {@render chatThread()}
  </main>

  {#if memberList}
    <div class="ds-chat-layout-members">
      {@render memberList()}
    </div>
  {/if}
</div>

<style>
  .ds-chat-layout {
    display: flex;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .ds-chat-layout-sidebar {
    height: 100%;
    /* Typically the Sidebar organism handles its own width/border */
  }

  .ds-chat-layout-main {
    flex: 1;
    min-width: 0;
    height: 100%;
    /* ChatPanel handles its own internal scrolling */
  }

  .ds-chat-layout-members {
    height: 100%;
    /* A ContextPanel is usually absolute, but can be static here */
  }
</style>
