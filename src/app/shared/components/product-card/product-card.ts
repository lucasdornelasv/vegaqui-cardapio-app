import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CircleBackgroundComponent } from '@components/circle-background/circle-background';
import { renderOrderMessage, whatsappLink } from '@common/contact-links.util';
import { HorizontalSide } from '@common/horizontal-side';
import { MENU_CONFIG } from '@domain/menu.config';
import { Product } from '@domain/menu.model';

@Component({
  selector: 'product-card',
  imports: [CurrencyPipe, CircleBackgroundComponent],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardComponent {
  readonly product = input.required<Product>();
  readonly imagePosition = input<HorizontalSide>('left');

  protected readonly orderHref = computed(() => {
    const message = renderOrderMessage(MENU_CONFIG.orderMessageTemplate, this.product().title);
    return whatsappLink(MENU_CONFIG.contact.whatsapp, message);
  });
}
