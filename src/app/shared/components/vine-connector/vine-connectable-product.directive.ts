import { Directive, DestroyRef, inject } from '@angular/core';
import { VineConnectableProduct } from './vine-connectable-product';
import { VineConnectorRegistry } from './vine-connector-registry';

/**
 * Aplicada junto com um componente que implementa `VineConnectableProduct`
 * (fornecido via DI no mesmo elemento). Registra esse produto no
 * `VineConnectorRegistry` mais próximo (provido por um `vineConnectorContext`
 * ancestral) enquanto o elemento existir.
 *
 * A injeção do registro é opcional: fora de um contexto de vine-connector,
 * a diretiva simplesmente não registra nada.
 */
@Directive({
  selector: '[vineConnectableProduct]',
})
export class VineConnectableProductDirective {
  private readonly product = inject(VineConnectableProduct);
  private readonly registry = inject(VineConnectorRegistry, { optional: true });

  constructor() {
    const registry = this.registry;
    if (!registry) {
      return;
    }

    registry.registerProduct(this.product);
    inject(DestroyRef).onDestroy(() => registry.unregisterProduct(this.product));
  }
}
