import { HorizontalSide } from '@common/horizontal-side';

/**
 * Contrato que um componente de produto precisa fornecer (via DI, no próprio
 * elemento) para participar da linha de conexão do vine-connector — sem que
 * o vine-connector precise conhecer sua estrutura DOM interna.
 */
export abstract class VineConnectableProduct {
  /** Elemento raiz do card — usado para excluir produtos fora da tela. */
  abstract getCardElement(): HTMLElement;

  /** Elemento que envolve a imagem — o trecho reto da linha passa atrás dele. */
  abstract getMediaElement(): HTMLElement;

  /** Elemento que envolve título/descrição/preço/botão — nunca pode ser cruzado pela linha. */
  abstract getContentElement(): HTMLElement;

  /** De que lado a imagem deste produto está posicionada. */
  abstract getSide(): HorizontalSide;
}
