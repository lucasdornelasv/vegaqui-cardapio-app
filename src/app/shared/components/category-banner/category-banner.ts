import { ChangeDetectionStrategy, Component, ElementRef, inject, input } from '@angular/core';
import { VineOrigin } from '@components/vine-connector/vine-origin';

@Component({
  selector: 'category-banner',
  templateUrl: './category-banner.html',
  styleUrl: './category-banner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: VineOrigin, useExisting: CategoryBannerComponent }],
})
export class CategoryBannerComponent implements VineOrigin {
  readonly title = input.required<string>();

  private readonly hostRef: ElementRef<HTMLElement> = inject(ElementRef);

  getElement(): HTMLElement {
    // Consulta ao vivo dentro do próprio host (não é `viewChild` em cache):
    // alguma reconciliação interna do Angular pode recriar este nó sem
    // atualizar uma referência guardada, deixando-a presa a um elemento já
    // desconectado do DOM. O host (`<category-banner>`) é `display: block` e
    // ocupa a largura toda do container — quem representa a posição visual
    // real é o balão em si (`.category-banner`, `width: fit-content`,
    // alinhado à esquerda).
    return this.hostRef.nativeElement.querySelector<HTMLElement>('.category-banner')!;
  }
}
