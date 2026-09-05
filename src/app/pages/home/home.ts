import { ChangeDetectionStrategy, Component } from '@angular/core';
import { instagramLink, phoneLink, whatsappLink } from '@common/contact-links.util';
import { HorizontalSide } from '@common/horizontal-side';
import { ProductCardComponent } from '@components/product-card/product-card';
import { VineConnectorComponent } from '@components/vine-connector/vine-connector';
import { MENU_CONFIG } from '@domain/menu.config';
import { PhonePipe } from '@pipes/phone.pipe';
import { SocialIconComponent } from '@components/social-icon/social-icon';

@Component({
  selector: 'home',
  imports: [ProductCardComponent, VineConnectorComponent, PhonePipe, SocialIconComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  protected readonly logoSrc = '/logo-full-transparente.png';
  protected readonly contact = MENU_CONFIG.contact;
  protected readonly products = MENU_CONFIG.products;

  protected readonly productSides: HorizontalSide[] = this.products.map((_, index) =>
    index % 2 === 0 ? 'left' : 'right',
  );

  protected readonly phoneHref = phoneLink(this.contact.phone);
  protected readonly whatsappHref = whatsappLink(this.contact.whatsapp);
  protected readonly instagramHref = instagramLink(this.contact.instagram);
}
