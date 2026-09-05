import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { HorizontalSide } from '@common/horizontal-side';

@Component({
  selector: 'circle-background',
  templateUrl: './circle-background.html',
  styleUrl: './circle-background.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CircleBackgroundComponent {
  readonly position = input<HorizontalSide>('left');
}
