// D0 Data Viz — Core Types
// Pure TypeScript — no Svelte, no DOM dependencies

// === Data Primitives ===

export interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface DataSeries {
  id: string;
  label: string;
  data: DataPoint[];
  color?: string;
}

// === Chart ===

export interface ChartProps {
  series: DataSeries[];
  width?: number;
  height?: number;
}

// === Metric Card ===

export interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'flat';
  trendValue?: string;
  /** 'default' = card block; 'inline' = compact horizontal for toolbars/headers */
  size?: 'default' | 'inline';
}

// === Timeline ===

export interface TimelineEntry {
  id: string;
  timestamp: string;
  label: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface TimelineProps {
  entries: TimelineEntry[];
  orientation?: 'horizontal' | 'vertical';
}
