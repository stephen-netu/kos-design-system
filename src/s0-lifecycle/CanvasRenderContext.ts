// S0 Lifecycle — Canvas 2D concrete RenderContext
// Wraps HTMLCanvasElement CanvasRenderingContext2D to implement RenderContext.
// All draw calls are batched within a single beginPath/restore cycle per frame.

import type { Rect, Point, Size } from '../p0-primitives/types/geometry';
import type { RenderContext, TextStyle, ClipRegion, DrawCommand } from './RenderContext';

export class CanvasRenderContext implements RenderContext {
  readonly viewportSize: Size;
  readonly scale: number;
  readonly maxTextureDimension: number | null = null;

  private ctx: CanvasRenderingContext2D;
  private commands: DrawCommand[] = [];

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2D context from canvas');
    this.ctx = ctx;
    this.viewportSize = { width: canvas.width, height: canvas.height };
    this.scale = window.devicePixelRatio ?? 1;
  }

  drawRect(rect: Rect, color: string): void {
    this.commands.push({ type: 'rect', rect, color });
  }

  drawText(position: Point, text: string, style: TextStyle): void {
    this.commands.push({ type: 'text', position, text, style });
  }

  drawImage(src: string, bounds: Rect): void {
    this.commands.push({ type: 'image', src, bounds });
  }

  pushClip(clip: ClipRegion): void {
    this.commands.push({ type: 'clip', clip, action: 'push' });
  }

  popClip(): void {
    this.commands.push({ type: 'clip', action: 'pop' });
  }

  /** Flush all accumulated draw commands to the canvas in zindex order. */
  flush(): void {
    const c = this.ctx;
    c.clearRect(0, 0, this.viewportSize.width, this.viewportSize.height);

    const sorted = [...this.commands].sort((a, b) => (a.zindex ?? 0) - (b.zindex ?? 0));

    for (const cmd of sorted) {
      if (cmd.type === 'rect') {
        c.fillStyle = cmd.color as string;
        const r = cmd.rect as Rect;
        c.fillRect(r.x, r.y, r.width, r.height);
      } else if (cmd.type === 'text') {
        const s = cmd.style as TextStyle;
        c.font = `${s.fontWeight ?? 400} ${s.fontSize ?? 14}px ${s.fontFamily ?? 'var(--font-mono, monospace)'}`;
        c.fillStyle = s.color ?? '#e8e0d0';
        const p = cmd.position as Point;
        c.fillText(cmd.text as string, p.x, p.y);
      } else if (cmd.type === 'clip') {
        if (cmd.action === 'push') {
          c.save();
          const clip = cmd.clip as ClipRegion;
          c.beginPath();
          c.rect(clip.bounds.x, clip.bounds.y, clip.bounds.width, clip.bounds.height);
          c.clip();
        } else {
          c.restore();
        }
      }
      // 'image' type: implement with ImageBitmap cache if needed later
    }

    this.commands = [];
  }
}
