import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { HorizontalSide } from '@common/horizontal-side';

const LEFT_X = 15;
const RIGHT_X = 85;
const SEGMENT_HEIGHT = 100;
const CONTROL_OFFSET = 25;

interface Point {
  x: number;
  y: number;
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

  readonly path = computed(() => this.buildPath(this.sides()));

  private buildPath(sides: HorizontalSide[]): string {
    if (sides.length === 0) {
      return '';
    }

    const anchors: Point[] = sides.map((side, index) => ({
      x: side === 'left' ? LEFT_X : RIGHT_X,
      y: (index + 0.5) * SEGMENT_HEIGHT,
    }));

    const start: Point = { x: 0, y: 0 };
    const end: Point = { x: 100, y: sides.length * SEGMENT_HEIGHT };
    const points: Point[] = [start, ...anchors, end];

    return points.slice(1).reduce((path, current, index) => {
      const previous = points[index];
      const direction = current.x >= previous.x ? 1 : -1;
      const midY = (previous.y + current.y) / 2;
      const control1: Point = { x: previous.x + direction * CONTROL_OFFSET, y: midY };
      const control2: Point = { x: current.x - direction * CONTROL_OFFSET, y: midY };

      return `${path} C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${current.x} ${current.y}`;
    }, `M ${start.x} ${start.y}`);
  }
}
