import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { HorizontalSide } from '@common/horizontal-side';

const LEFT_X = 15;
const RIGHT_X = 85;
const SEGMENT_HEIGHT = 100;

// Distance (in y) from each product's own anchor to where its "straight,
// hidden behind the image" run ends and the wavy gap to the next product
// begins.
const ROW_HALF_SPAN = 25;

// The gentle "down, slightly up, down again" motion lives entirely in the gap
// between two products — never inside a row, so it can't cross a
// title/description/price/button.
const WAVE_X_AMPLITUDE = 22;
const WAVE_RISE_FRACTION = 0.35;

interface Point {
  x: number;
  y: number;
}

function clamp(x: number): number {
  return Math.max(0, Math.min(100, x));
}

// Three waypoints between two points: mostly descending, with a single small
// upward hitch in the middle (never a full reversal past the start) and one
// gentle sideways bulge — not a multi-cycle wiggle. Deterministic (seeded
// only by index) so server and client render identically.
function sampleGapWave(from: Point, to: Point, seed: number): Point[] {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const direction = Math.sin(seed * 1.7) >= 0 ? 1 : -1;
  const amplitude = WAVE_X_AMPLITUDE * (0.7 + 0.3 * Math.abs(Math.cos(seed * 1.3)));
  const rise = dy * WAVE_RISE_FRACTION;

  return [
    { x: clamp(from.x + dx * 0.3 + direction * amplitude * 0.5), y: from.y + dy * 0.3 },
    { x: clamp(from.x + dx * 0.55 + direction * amplitude), y: from.y + dy * 0.55 - rise },
    { x: clamp(from.x + dx * 0.8 + direction * amplitude * 0.5), y: from.y + dy * 0.8 },
  ];
}

// Smoothly interpolates through every point (Catmull-Rom converted to cubic
// Bezier segments) — points that happen to share the same x (the runs behind
// each product image) come out as a near-straight line for free.
function toSmoothPath(points: Point[]): string {
  if (points.length === 0) {
    return '';
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const control1: Point = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const control2: Point = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };

    path += ` C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${p2.x} ${p2.y}`;
  }

  return path;
}

@Component({
  selector: 'vine-connector',
  templateUrl: './vine-connector.html',
  styleUrl: './vine-connector.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VineConnectorComponent {
  readonly sides = input<HorizontalSide[]>([]);

  readonly viewBoxHeight = computed(() => this.sides().length * SEGMENT_HEIGHT);

  readonly path = computed(() => toSmoothPath(this.buildPoints(this.sides())));

  private buildPoints(sides: HorizontalSide[]): Point[] {
    if (sides.length === 0) {
      return [];
    }

    const points: Point[] = [{ x: 0, y: 0 }];
    let seed = 0;

    sides.forEach((side, index) => {
      const anchorX = side === 'left' ? LEFT_X : RIGHT_X;
      const anchorY = (index + 0.5) * SEGMENT_HEIGHT;
      const entry: Point = { x: anchorX, y: anchorY - ROW_HALF_SPAN };
      const exit: Point = { x: anchorX, y: anchorY + ROW_HALF_SPAN };

      points.push(...sampleGapWave(points[points.length - 1], entry, seed++));
      points.push(entry, exit);
    });

    // Ends right at the last product — no trailing wave past it.
    return points;
  }
}
