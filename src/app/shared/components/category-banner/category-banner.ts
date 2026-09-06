import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'category-banner',
  templateUrl: './category-banner.html',
  styleUrl: './category-banner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryBannerComponent {
  readonly title = input.required<string>();
}
