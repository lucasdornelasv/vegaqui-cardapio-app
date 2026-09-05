import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type SocialIconType = 'phone' | 'whatsapp' | 'instagram';

@Component({
  selector: 'social-icon',
  templateUrl: './social-icon.html',
  styleUrl: './social-icon.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialIconComponent {
  readonly icon = input.required<SocialIconType>();
}
