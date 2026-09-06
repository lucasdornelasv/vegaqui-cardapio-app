import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'leaf-pattern',
  templateUrl: './leaf-pattern.html',
  styleUrl: './leaf-pattern.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeafPatternComponent {}
