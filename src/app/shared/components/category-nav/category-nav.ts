import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterEveryRender,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';

export interface CategoryNavItem {
  title: string;
  slug: string;
}

@Component({
  selector: 'category-nav',
  imports: [NgTemplateOutlet],
  templateUrl: './category-nav.html',
  styleUrl: './category-nav.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryNavComponent {
  readonly categories = input.required<CategoryNavItem[]>();

  protected readonly logoSrc = '/logo-icon-transparente.png';
  protected readonly showFixedNav = signal(false);
  protected readonly activeSlug = signal<string | null>(null);

  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly inFlowNav = viewChild.required<ElementRef<HTMLElement>>('inFlowNav');

  private visibilityObserver?: IntersectionObserver;
  private observedNav: HTMLElement | null = null;
  private sectionObserver?: IntersectionObserver;

  constructor() {
    // `afterEveryRender` só executa no navegador (nunca durante SSR). Reconferimos
    // a cada render e trocamos o alvo observado se ele mudou, em vez de observar
    // uma única vez e arriscar ficar com um nó desconectado do DOM.
    afterEveryRender(() => {
      this.visibilityObserver ??= this.createVisibilityObserver();

      const el = this.inFlowNav().nativeElement;
      if (el !== this.observedNav) {
        this.visibilityObserver.disconnect();
        this.visibilityObserver.observe(el);
        this.observedNav = el;
      }

      this.sectionObserver ??= this.observeActiveSection();
    });

    this.destroyRef.onDestroy(() => {
      this.visibilityObserver?.disconnect();
      this.sectionObserver?.disconnect();
    });
  }

  protected onTabClick(event: Event, slug: string): void {
    event.preventDefault();

    const target = this.document.getElementById(slug);
    if (!target) {
      return;
    }

    target.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Atualiza a URL sem navegar: diferente de `location.hash = slug`, isto
    // não dispara o salto instantâneo nativo do navegador para a âncora, que
    // cancelaria a animação suave do scrollIntoView acima.
    this.document.defaultView?.history.pushState(null, '', `#${slug}`);
  }

  /** Mostra a nav fixa somente depois que a nav "normal" (no fluxo da página) some inteiramente da tela. */
  private createVisibilityObserver(): IntersectionObserver {
    return new IntersectionObserver(
      ([entry]) => {
        // Ignora leituras com viewport zerado: acontecem por uma fração de
        // segundo logo após a hidratação, antes do elemento observado ter uma
        // caixa de layout válida, e não devem travar showFixedNav em true.
        if (!entry.rootBounds || (entry.rootBounds.width === 0 && entry.rootBounds.height === 0)) {
          return;
        }

        this.showFixedNav.set(!entry.isIntersecting);
      },
      { threshold: 0 },
    );
  }

  /** Marca como ativa a aba da seção mais próxima do topo, logo abaixo da nav fixa. */
  private observeActiveSection(): IntersectionObserver | undefined {
    const sections = this.categories()
      .map((category) => this.document.getElementById(category.slug))
      .filter((section): section is HTMLElement => section !== null);

    if (sections.length === 0) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) {
          return;
        }

        const topMost = visible.reduce((a, b) =>
          a.boundingClientRect.top < b.boundingClientRect.top ? a : b,
        );
        this.activeSlug.set(topMost.target.id);
      },
      { rootMargin: '-96px 0px -70% 0px', threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    return observer;
  }
}
