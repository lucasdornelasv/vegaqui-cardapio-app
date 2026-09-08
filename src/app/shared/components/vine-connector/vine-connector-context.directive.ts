import { Directive } from '@angular/core';
import { VineConnectorRegistry } from './vine-connector-registry';

/**
 * Define, no elemento onde é aplicada, o contexto (escopo) em que uma linha
 * de conexão deve ser gerada: provê um `VineConnectorRegistry` próprio, que
 * `VineConnectableProductDirective`, `VineOriginDirective` e o próprio
 * `vine-connector` (todos dentro deste elemento) resolvem via injeção de
 * dependência hierárquica — sem nenhuma referência direta entre eles.
 */
@Directive({
  selector: '[vineConnectorContext]',
  providers: [VineConnectorRegistry],
})
export class VineConnectorContextDirective {}
