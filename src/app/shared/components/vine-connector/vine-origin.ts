/**
 * Contrato que um componente pode fornecer (via DI, no próprio elemento)
 * para marcar o ponto de partida da linha de conexão do vine-connector.
 */
export abstract class VineOrigin {
  abstract getElement(): HTMLElement;
}
