export type DiagramType = 'mermaid' | 'markmap';

export interface DiagramSpec {
  type: DiagramType;
  source: string;
  title?: string;
  provenance?: DiagramProvenance;
}

export interface DiagramProvenance {
  sourceFile: string;
  sourceHash: string;
  generationSeq: number;
  sacsRefreshSeq: number;
}

export interface RenderOptions {
  theme?: 'dark' | 'light';
  width?: number;
  height?: number;
  padding?: number;
}

export interface DiagramPanelItem {
  id: string;
  spec: DiagramSpec;
  options?: RenderOptions;
}
