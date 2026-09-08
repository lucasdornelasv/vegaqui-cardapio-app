import { Directive, DestroyRef, inject } from '@angular/core';
import { VineConnectorRegistry } from './vine-connector-registry';
import { VineOrigin } from './vine-origin';

/**
 * Aplicada junto com um componente que implementa `VineOrigin` (fornecido via
 * DI no mesmo elemento). Marca esse elemento como o ponto de partida da
 * linha de conexão no `VineConnectorRegistry` mais próximo (provido por um
 * `vineConnectorContext` ancestral).
 *
 * A injeção do registro é opcional: fora de um contexto de vine-connector,
 * a diretiva simplesmente não registra nada.
 */
@Directive({
  selector: '[vineOrigin]',
})
export class VineOriginDirective {
  private readonly origin = inject(VineOrigin);
  private readonly registry = inject(VineConnectorRegistry, { optional: true });

  constructor() {
    const registry = this.registry;
    if (!registry) {
      return;
    }

    registry.setOrigin(this.origin);
    inject(DestroyRef).onDestroy(() => registry.clearOrigin(this.origin));
  }
}
