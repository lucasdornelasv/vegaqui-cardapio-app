import { ChangeDetectionStrategy, Component } from '@angular/core';
import { instagramLink, phoneLink, whatsappLink } from '@common/contact-links.util';
import { HorizontalSide } from '@common/horizontal-side';
import { slugify } from '@common/slug.util';
import { CategoryBannerComponent } from '@components/category-banner/category-banner';
import { CategoryNavComponent } from '@components/category-nav/category-nav';
import { ProductCardComponent } from '@components/product-card/product-card';
import { VineConnectorComponent } from '@components/vine-connector/vine-connector';
import { MENU_CONFIG } from '@domain/menu.config';
import { Product } from '@domain/menu.model';
import { PhonePipe } from '@pipes/phone.pipe';
import { SocialIconComponent } from '@components/social-icon/social-icon';

interface CategoryViewModel {
  title: string;
  slug: string;
  products: Product[];
  sides: HorizontalSide[];
}

function byTitle(a: { title: string }, b: { title: string }): number {
  return a.title.localeCompare(b.title, 'pt-BR');
}

@Component({
  selector: 'home',
  imports: [
    CategoryBannerComponent,
    CategoryNavComponent,
    ProductCardComponent,
    VineConnectorComponent,
    PhonePipe,
    SocialIconComponent,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  protected readonly logoSrc = '/logo-full-transparente.png';
  protected readonly contact = MENU_CONFIG.contact;

  protected readonly categories: CategoryViewModel[] = [...MENU_CONFIG.categories]
    .filter((category) => category.products.length > 0)
    .sort(byTitle)
    .map((category) => {
      const products = [...category.products].sort(byTitle);
      const sides: HorizontalSide[] = products.map((_, index) =>
        index % 2 === 0 ? 'left' : 'right',
      );

      return { title: category.title, slug: slugify(category.title), products, sides };
    });

  protected readonly phoneHref = phoneLink(this.contact.phone);
  protected readonly whatsappHref = whatsappLink(this.contact.whatsapp);
  protected readonly instagramHref = instagramLink(this.contact.instagram);
}
