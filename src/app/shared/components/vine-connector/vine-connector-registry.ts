import { Injectable, signal } from '@angular/core';
import { VineConnectableProduct } from './vine-connectable-product';
import { VineOrigin } from './vine-origin';

/**
 * Mantém, para uma categoria, quem está registrado para participar da linha
 * de conexão — os produtos (via `VineConnectableProductDirective`) e a origem
 * (via `VineOriginDirective`) — para que o vine-connector calcule a linha sem
 * conhecer o DOM de nenhum dos dois diretamente.
 *
 * Instanciado uma vez por categoria pelo `VineConnectorContextDirective`
 * (`providers: [VineConnectorRegistry]`), então cada categoria tem seu
 * próprio registro isolado, resolvido pela árvore de injeção do Angular.
 */
@Injectable()
export class VineConnectorRegistry {
  private readonly _products = signal<VineConnectableProduct[]>([]);
  private readonly _origin = signal<VineOrigin | null>(null);

  readonly products = this._products.asReadonly();
  readonly origin = this._origin.asReadonly();

  registerProduct(product: VineConnectableProduct): void {
    this._products.update((products) => [...products, product]);
  }

  unregisterProduct(product: VineConnectableProduct): void {
    this._products.update((products) => products.filter((registered) => registered !== product));
  }

  setOrigin(origin: VineOrigin): void {
    this._origin.set(origin);
  }

  clearOrigin(origin: VineOrigin): void {
    this._origin.update((current) => (current === origin ? null : current));
  }
}
