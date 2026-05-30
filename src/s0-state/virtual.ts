/**
 * Virtual Scrolling Utilities
 * 
 * Generalized versions of NNJAS lazyLoad utilities for the LEAP design system.
 * Provides virtual list calculations and preloading for performance-critical lists.
 */

export interface VirtualListConfig {
  /** Total number of items */
  itemCount: number;
  /** Height of each item in pixels */
  itemHeight: number;
  /** Number of items to render outside visible area (for smoother scrolling) */
  overscan: number;
  /** Height of the container viewport */
  containerHeight: number;
}

export interface VirtualItem {
  index: number;
  /** Offset from top of container in pixels */
  offset: number;
  /** Whether this item is currently visible */
  isVisible: boolean;
}

export interface VirtualList {
  /** Get visible items for a given scroll position */
  getVisibleItems(scrollTop: number): VirtualItem[];
  /** Total height of the virtual container */
  totalHeight: number;
}

/**
 * Create a virtual list calculator
 * 
 * Efficiently calculates which items should be rendered based on scroll position.
 * Use with fixed-height items (grid rows, list items).
 * 
 * @example
 * const virtualList = createVirtualList({
 *   itemCount: 1000,
 *   itemHeight: 50,
 *   overscan: 5,
 *   containerHeight: 400
 * });
 * 
 * // In scroll handler
 * const visible = virtualList.getVisibleItems(scrollTop);
 */
export function createVirtualList<T>(config: VirtualListConfig): VirtualList {
  const { itemCount, itemHeight, overscan, containerHeight } = config;
  const totalHeight = itemCount * itemHeight;

  return {
    getVisibleItems(scrollTop: number): VirtualItem[] {
      // Calculate visible range
      const startIndex = Math.floor(scrollTop / itemHeight);
      const visibleCount = Math.ceil(containerHeight / itemHeight);
      
      // Add overscan
      const renderStart = Math.max(0, startIndex - overscan);
      const renderEnd = Math.min(itemCount, startIndex + visibleCount + overscan);
      
      const items: VirtualItem[] = [];
      for (let i = renderStart; i < renderEnd; i++) {
        items.push({
          index: i,
          offset: i * itemHeight,
          isVisible: i >= startIndex && i < startIndex + visibleCount
        });
      }
      
      return items;
    },
    totalHeight
  };
}

export interface PreloaderConfig {
  /** Number of items/screens to preload ahead of visible area */
  preloadAhead: number;
  /** Number of items/screens to keep loaded behind visible area */
  keepBehind?: number;
}

export interface PreloaderState<T> {
  /** Items currently loaded */
  loaded: Set<T>;
  /** Items currently loading */
  loading: Set<T>;
  /** Items that should be unloaded */
  toUnload: Set<T>;
}

/**
 * Create a preloader for managing lazy-loaded content
 * 
 * Tracks what should be loaded based on visible range and preload configuration.
 * 
 * @example
 * const preloader = createPreloader({ preloadAhead: 2 });
 * 
 * // In effect
 * $effect(() => {
 *   const visibleIds = getVisibleItemIds();
 *   const state = preloader.update(visibleIds);
 *   // Load state.toLoad, unload state.toUnload
 * });
 */
export function createPreloader<T extends string | number>(config: PreloaderConfig) {
  const { preloadAhead, keepBehind = 1 } = config;
  const loaded = new Set<T>();
  const loading = new Set<T>();

  return {
    /**
     * Update preloader state based on currently visible items
     * @param visibleIds - IDs of items currently visible
     * @param allIds - All available item IDs (for calculating preload range)
     * @returns State indicating what to load and unload
     */
    update(
      visibleIds: T[],
      allIds: T[]
    ): { toLoad: T[]; toUnload: T[]; loaded: Set<T>; loading: Set<T> } {
      const visibleSet = new Set(visibleIds);
      
      // Calculate preload range indices
      const visibleIndices = visibleIds
        .map(id => allIds.indexOf(id))
        .filter(i => i >= 0)
        .sort((a, b) => a - b);
      
      if (visibleIndices.length === 0) {
        return { toLoad: [], toUnload: [...loaded], loaded, loading };
      }
      
      const firstVisible = visibleIndices[0];
      const lastVisible = visibleIndices[visibleIndices.length - 1];
      
      // Calculate range to keep loaded
      const keepStart = Math.max(0, firstVisible - keepBehind);
      const keepEnd = Math.min(allIds.length, lastVisible + preloadAhead);
      
      const toKeep = new Set(allIds.slice(keepStart, keepEnd));
      
      // Determine what to load and unload
      const toLoad: T[] = [];
      for (const id of toKeep) {
        if (!loaded.has(id) && !loading.has(id)) {
          toLoad.push(id);
        }
      }
      
      const toUnload: T[] = [];
      for (const id of loaded) {
        if (!toKeep.has(id) && !visibleSet.has(id)) {
          toUnload.push(id);
        }
      }
      
      return { toLoad, toUnload, loaded, loading };
    },

    /** Mark an item as loading */
    markLoading(id: T) {
      loading.add(id);
    },

    /** Mark an item as loaded (removes from loading, adds to loaded) */
    markLoaded(id: T) {
      loading.delete(id);
      loaded.add(id);
    },

    /** Mark an item as unloaded */
    markUnloaded(id: T) {
      loaded.delete(id);
      loading.delete(id);
    },

    /** Get current state */
    getState(): PreloaderState<T> {
      return {
        loaded: new Set(loaded),
        loading: new Set(loading),
        toUnload: new Set()
      };
    },

    /** Reset all state */
    reset() {
      loaded.clear();
      loading.clear();
    }
  };
}

/**
 * Calculate grid layout for virtual scrolling
 * 
 * Helper for grid-based virtual scrolling (masonry, card grids).
 * 
 * @example
 * const grid = calculateGridLayout({
 *   totalItems: 100,
 *   containerWidth: 800,
   itemWidth: 150,
 *   gap: 16
 * });
 * // grid.columns = 5, grid.rows = 20
 */
export function calculateGridLayout(config: {
  totalItems: number;
  containerWidth: number;
  itemWidth: number;
  gap: number;
}): { columns: number; rows: number; effectiveWidth: number } {
  const { totalItems, containerWidth, itemWidth, gap } = config;
  
  // Calculate columns that fit
  const columns = Math.max(1, Math.floor((containerWidth + gap) / (itemWidth + gap)));
  const effectiveWidth = columns * itemWidth + (columns - 1) * gap;
  const rows = Math.ceil(totalItems / columns);
  
  return { columns, rows, effectiveWidth };
}

/**
 * Create a virtual grid calculator
 * 
 * Specialized virtual list for grid layouts with fixed item sizes.
 * Returns row-based virtual items that can be flattened to individual items.
 * 
 * @example
 * const virtualGrid = createVirtualGrid({
 *   totalItems: 500,
 *   columns: 5,
 *   itemHeight: 120,
 *   gap: 8,
 *   overscan: 2,
 *   containerHeight: 600
 * });
 */
export function createVirtualGrid(config: {
  totalItems: number;
  columns: number;
  itemHeight: number;
  gap: number;
  overscan: number;
  containerHeight: number;
}): {
  getVisibleRows(scrollTop: number): VirtualItem[];
  getItemsInRow(rowIndex: number): number[];
  totalHeight: number;
  totalRows: number;
} {
  const { totalItems, columns, itemHeight, gap, overscan, containerHeight } = config;
  
  const rowHeight = itemHeight + gap;
  const totalRows = Math.ceil(totalItems / columns);
  const totalHeight = totalRows * rowHeight - gap; // Subtract trailing gap
  
  return {
    getVisibleRows(scrollTop: number): VirtualItem[] {
      const startRow = Math.floor(scrollTop / rowHeight);
      const visibleRows = Math.ceil(containerHeight / rowHeight);
      
      const renderStart = Math.max(0, startRow - overscan);
      const renderEnd = Math.min(totalRows, startRow + visibleRows + overscan);
      
      const rows: VirtualItem[] = [];
      for (let i = renderStart; i < renderEnd; i++) {
        rows.push({
          index: i,
          offset: i * rowHeight,
          isVisible: i >= startRow && i < startRow + visibleRows
        });
      }
      
      return rows;
    },
    
    getItemsInRow(rowIndex: number): number[] {
      const startIndex = rowIndex * columns;
      const items: number[] = [];
      for (let i = 0; i < columns; i++) {
        const index = startIndex + i;
        if (index < totalItems) {
          items.push(index);
        }
      }
      return items;
    },
    
    totalHeight,
    totalRows
  };
}
