import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input } from '@angular/core';
import { CircleBackgroundComponent } from '@components/circle-background/circle-background';
import { VineConnectableProduct } from '@components/vine-connector/vine-connectable-product';
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
  providers: [{ provide: VineConnectableProduct, useExisting: ProductCardComponent }],
})
export class ProductCardComponent implements VineConnectableProduct {
  readonly product = input.required<Product>();
  readonly imagePosition = input<HorizontalSide>('left');

  protected readonly orderHref = computed(() => {
    const message = renderOrderMessage(MENU_CONFIG.orderMessageTemplate, this.product().title);
    return whatsappLink(MENU_CONFIG.contact.whatsapp, message);
  });

  private readonly hostRef: ElementRef<HTMLElement> = inject(ElementRef);

  getCardElement(): HTMLElement {
    return this.hostRef.nativeElement;
  }

  getMediaElement(): HTMLElement {
    // Consulta ao vivo dentro do próprio host (não é `viewChild` em cache):
    // alguma reconciliação interna do Angular pode recriar este nó sem
    // atualizar uma referência guardada, deixando-a presa a um elemento já
    // desconectado do DOM.
    return this.hostRef.nativeElement.querySelector<HTMLElement>('.product-card__media')!;
  }

  getContentElement(): HTMLElement {
    return this.hostRef.nativeElement.querySelector<HTMLElement>('.product-card__content')!;
  }

  getSide(): HorizontalSide {
    return this.imagePosition();
  }
}
