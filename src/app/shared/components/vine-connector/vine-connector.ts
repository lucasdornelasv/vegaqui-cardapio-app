import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterEveryRender,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { VineConnectableProduct } from './vine-connectable-product';
import { VineConnectorRegistry } from './vine-connector-registry';
import { VineOrigin } from './vine-origin';
import { RxResizeObserver } from '@rxjs-toolkit/resize-observer';
import { asapScheduler, debounceTime, startWith, Subscription } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Fallback usado antes da primeira medição real no navegador (e durante o
// SSR, que nunca mede): assume uma fileira uniforme por produto, com a
// imagem alternando de lado como no layout lado a lado (desktop).
const FALLBACK_SEGMENT_HEIGHT = 100;
const FALLBACK_LEFT_X = 15;
const FALLBACK_RIGHT_X = 85;
const FALLBACK_ROW_HALF_SPAN_FRACTION = 0.25;
const FALLBACK_ORIGIN: Point = { x: 0, y: 0 };

// Abaixo desse valor (em % da largura do contêiner), a margem livre de texto
// de um lado é considerada "estreita" — sinal de que o layout empilhou imagem
// e texto (mobile) em vez de colocá-los lado a lado (desktop): o texto ocupa
// quase toda a largura, e não sobra espaço ao lado dele para o traço passar.
const NARROW_GUTTER_THRESHOLD = 15;

// Empilhado (mobile): distância fixa da borda lateral da página para o
// trecho que desce ao lado do texto — perto o bastante pra não parecer solto,
// longe o bastante pra não colar na borda.
const STACKED_EDGE_MARGIN_PX = 10;

const WAVE_X_AMPLITUDE = 22;
const WAVE_RISE_FRACTION = 0.35;

interface Point {
  x: number;
  y: number;
}

interface RowGeometry {
  /** Topo do produto (imagem ou texto, o que estiver mais acima), em px relativos ao topo do contêiner. Só usado lado a lado. */
  entryY: number;
  /** Centro horizontal (0-100) da imagem — a linha sempre passa exatamente por aqui. */
  mediaCenterX: number;
  /** Centro vertical da imagem, em px relativos ao topo do contêiner. */
  mediaCenterY: number;
  /** Fim da imagem, em px relativos ao topo do contêiner. */
  mediaBottom: number;
  /** Fim do produto (imagem ou texto, o que estiver mais abaixo). */
  exitY: number;
  /** Posição horizontal (0-100) do trecho reto ao lado do texto: lado a lado é igual a `mediaCenterX`; empilhado é a lateral com margem fixa. */
  anchorX: number;
}

interface Geometry {
  /** Empilhado (mobile): imagem acima do texto, ocupando quase toda a largura. */
  isStacked: boolean;
  rows: RowGeometry[];
  /** Ponto de onde a linha parte — a origem registrada (título da categoria), ou um fallback. */
  origin: Point;
}

interface ContainerRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function clamp(x: number): number {
  return Math.max(0, Math.min(100, x));
}

function sameContainerRect(a: ContainerRect | null, b: ContainerRect | null): boolean {
  return a?.top === b?.top && a?.left === b?.left && a?.width === b?.width && a?.height === b?.height;
}

function isDisconnected(element: HTMLElement): boolean {
  return !element.isConnected;
}

// Three waypoints between two points: mostly descending, with a single small
// upward hitch in the middle (never a full reversal past the start) and one
// gentle sideways bulge — not a multi-cycle wiggle. Deterministic (seeded
// only by index) so server and client render identically.
function sampleGapWave(from: Point, to: Point, amplitude: number, seed: number): Point[] {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const direction = Math.sin(seed * 1.7) >= 0 ? 1 : -1;
  const wobble = amplitude * (0.7 + 0.3 * Math.abs(Math.cos(seed * 1.3)));
  const rise = dy * WAVE_RISE_FRACTION;

  return [
    { x: clamp(from.x + dx * 0.3 + direction * wobble * 0.5), y: from.y + dy * 0.3 },
    { x: clamp(from.x + dx * 0.55 + direction * wobble), y: from.y + dy * 0.55 - rise },
    { x: clamp(from.x + dx * 0.8 + direction * wobble * 0.5), y: from.y + dy * 0.8 },
  ];
}

// Smoothly interpolates through every point (Catmull-Rom converted to cubic
// Bezier segments) — points that happen to share the same x (the runs behind
// each product image) come out as a near-straight line for free.
function toSmoothPath(points: Point[]): string {
  if (points.length === 0) {
    return '';
  }

  const segments: string[] = [`M ${points[0].x} ${points[0].y}`];

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const control1: Point = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const control2: Point = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };

    segments.push(`C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${p2.x} ${p2.y}`);
  }

  return segments.join(' ');
}

function uniformGeometry(productCount: number): Geometry {
  const rows: RowGeometry[] = Array.from({ length: productCount }, (_, index) => {
    const center = (index + 0.5) * FALLBACK_SEGMENT_HEIGHT;
    const halfSpan = FALLBACK_SEGMENT_HEIGHT * FALLBACK_ROW_HALF_SPAN_FRACTION;
    const anchorX = index % 2 === 0 ? FALLBACK_LEFT_X : FALLBACK_RIGHT_X;

    return {
      entryY: center - halfSpan,
      mediaCenterX: anchorX,
      mediaCenterY: center,
      mediaBottom: center,
      exitY: center + halfSpan,
      anchorX,
    };
  });

  return { isStacked: false, rows, origin: FALLBACK_ORIGIN };
}

@Component({
  selector: 'vine-connector',
  templateUrl: './vine-connector.html',
  styleUrl: './vine-connector.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VineConnectorComponent {
  private readonly registry = inject(VineConnectorRegistry);
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  // Só guarda o retângulo do container — atualizado pelo ResizeObserver, mas
  // somente quando algo realmente muda (ver `sameContainerRect`). A medição
  // pesada (produtos, origem, geometria final) roda à parte, num `effect`,
  // sempre numa TICK seguinte: assim o primeiro render (fallback/SSR) nunca
  // fica "preso" na mesma passada que o recálculo real, o que era a causa da
  // linha parecer "piscar" (carregar de um jeito e mudar de forma logo em
  // seguida).
  private readonly containerRect = signal<ContainerRect | null>(null);

  private readonly measuredGeometry = signal<Geometry | null>(null);

  private resizeObserverSubscription?: Subscription;
  private observedContainer: HTMLElement | null = null;

  readonly viewBoxHeight = computed(
    () => this.containerRect()?.height || 0,
  );

  readonly path = computed(() => {
    const geometry = this.effectiveGeometry();
    const points = geometry.isStacked
      ? this.buildStackedPoints(geometry.rows, geometry.origin)
      : this.buildRowPoints(geometry.rows, geometry.origin);

    return toSmoothPath(points);
  });

  constructor() {
    const watchContainerResize = () => {
      const container = this.host?.nativeElement?.parentElement;
      if (container === this.observedContainer) {
        return;
      }

      this.resizeObserverSubscription?.unsubscribe();
      this.observedContainer = container;
      
      if (container) {
        this.resizeObserverSubscription = RxResizeObserver.observe(container)
          .pipe(
            startWith(null),
            debounceTime(0, asapScheduler),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe(() => this.updateContainerRect(container));
      } else {
        this.updateContainerRect(container);
      }
    };

    // `afterEveryRender` só executa no navegador (nunca durante SSR). A
    // hidratação pode recriar o container logo após o primeiro render, então
    // reconferimos a cada render e trocamos o alvo observado se ele mudou.
    afterEveryRender(watchContainerResize);

    // Recalcula a geometria completa sempre que o retângulo do container
    // mudar de verdade, ou o conjunto de produtos/origem registrados mudar —
    // nunca na mesma tick do ResizeObserver.
    effect(() => {
      const rect = this.containerRect();
      if (!rect) {
        return;
      }

      const products = this.registry.products();
      const origin = this.registry.origin();
      this.recomputeGeometry(rect, products, origin);
    });
  }

  private updateContainerRect(container: HTMLElement | null): void {
    const rect = container?.getBoundingClientRect();
    const next: ContainerRect | null = !rect ? null : { top: rect.top, left: rect.left, width: rect.width, height: rect.height };

    if (sameContainerRect(this.containerRect(), next)) {
      return;
    }

    this.containerRect.set(next);
  }

  private effectiveGeometry(): Geometry {
    const measured = this.measuredGeometry();
    const products = this.registry.products();
    return measured && measured.rows.length === products.length
      ? measured
      : uniformGeometry(products.length);
  }

  /**
   * Mede, para cada produto registrado (via `VineConnectableProductDirective`
   * — nunca acessado diretamente por seletor), a posição real da imagem e do
   * texto, para nunca desenhar o traço por cima do título/descrição/preço/
   * botão — nem verticalmente (a altura do texto varia bastante entre
   * produtos) nem horizontalmente (a margem livre ao lado do texto também
   * varia conforme o layout). O ponto de partida vem da origem registrada
   * (via `VineOriginDirective`, tipicamente o título da categoria).
   */
  private recomputeGeometry(
    containerRect: ContainerRect,
    products: readonly VineConnectableProduct[],
    origin: VineOrigin | null,
  ): void {
    if (!containerRect.height || products.length === 0) {
      this.measuredGeometry.set(null);
      return;
    }

    // Alguma reconciliação interna do Angular (às vezes disparada logo após
    // a hidratação, ou por um resize) pode recriar o DOM de um produto entre
    // o momento em que o `ResizeObserver` acorda e o momento em que a
    // diretiva correspondente reconecta seu registro. Se pegarmos esse
    // instante no meio do caminho, os elementos ainda registrados ficam
    // desconectados (`isConnected: false`) e toda medição sai zerada. Melhor
    // ignorar essa leitura e manter a última geometria válida do que travar
    // a linha numa forma quebrada — o próprio ResizeObserver dispara de novo
    // assim que o DOM se estabilizar.
    if (
      (origin && isDisconnected(origin.getElement())) ||
      products.some((product) => isDisconnected(product.getMediaElement()) || isDisconnected(product.getContentElement()))
    ) {
      return;
    }

    const originPoint = this.measureOrigin(origin, containerRect);

    const toPercent = (px: number) => ((px - containerRect.left) / containerRect.width) * 100;

    const measured = products.map((product) => {
      const mediaRect = product.getMediaElement().getBoundingClientRect();
      const contentRect = product.getContentElement().getBoundingClientRect();

      return {
        // No layout lado a lado, imagem e texto ficam centralizados um contra
        // o outro (`align-items: center`): quando a descrição é longa, o
        // texto pode ficar mais alto que a imagem e se estender além dela.
        entryY: Math.min(mediaRect.top, contentRect.top) - containerRect.top,
        mediaCenterX: toPercent((mediaRect.left + mediaRect.right) / 2),
        mediaCenterY: (mediaRect.top + mediaRect.bottom) / 2 - containerRect.top,
        mediaBottom: mediaRect.bottom - containerRect.top,
        exitY: Math.max(mediaRect.bottom, contentRect.bottom) - containerRect.top,
        leftGutter: toPercent(contentRect.left),
        rightGutter: 100 - toPercent(contentRect.right),
        side: product.getSide(),
      };
    });

    const isStacked = measured.every(
      (row) => Math.max(row.leftGutter, row.rightGutter) < NARROW_GUTTER_THRESHOLD,
    );

    const edgeMargin = (STACKED_EDGE_MARGIN_PX / containerRect.width) * 100;

    const rows = measured.map((row) => {
      const preferLeft = row.side === 'left';

      return {
        entryY: row.entryY,
        mediaCenterX: row.mediaCenterX,
        mediaCenterY: row.mediaCenterY,
        mediaBottom: row.mediaBottom,
        exitY: row.exitY,
        // Lado a lado, o próprio centro da imagem já fica bem longe do texto
        // (colunas separadas) — não precisa de mais nada. Empilhado, o texto
        // ocupa quase toda a largura, então o trecho ao lado dele fica preso
        // à lateral (ver `STACKED_EDGE_MARGIN_PX`), não no centro da imagem.
        anchorX: isStacked ? (preferLeft ? edgeMargin : 100 - edgeMargin) : row.mediaCenterX,
      };
    });

    this.measuredGeometry.set({ isStacked, rows, origin: originPoint });
  }

  private measureOrigin(origin: VineOrigin | null, containerRect: ContainerRect): Point {
    // `containerRect.height` já foi validado por quem chama (`recomputeGeometry`).
    if (!origin) {
      return FALLBACK_ORIGIN;
    }

    const rect = origin.getElement().getBoundingClientRect();
    return {
      x: clamp(((rect.left + rect.width / 2 - containerRect.left) / containerRect.width) * 100),
      y: rect.bottom - containerRect.top,
    };
  }

  /**
   * Lado a lado (desktop): o trecho reto fica sempre no centro da imagem
   * (imagem e texto dividem a largura em colunas separadas, então o centro
   * da imagem nunca esbarra no texto) e cobre a fileira inteira; a onda de
   * transição para o próximo produto acontece no espaço vazio entre uma
   * fileira e a próxima. No último produto, a linha termina exatamente no
   * centro da imagem — não continua até o fim do texto.
   */
  private buildRowPoints(rows: RowGeometry[], origin: Point): Point[] {
    if (rows.length === 0) {
      return [];
    }

    const points: Point[] = [origin];
    let seed = 0;
    const lastIndex = rows.length - 1;

    rows.forEach((row, index) => {
      const entry: Point = { x: row.anchorX, y: row.entryY };
      points.push(...sampleGapWave(points[points.length - 1], entry, WAVE_X_AMPLITUDE, seed++));
      points.push(entry);

      if (index === lastIndex) {
        points.push({ x: row.mediaCenterX, y: row.mediaCenterY });
      } else {
        points.push({ x: row.anchorX, y: row.exitY });
      }
    });

    return points;
  }

  /**
   * Empilhado (mobile): a imagem fica acima do texto, que ocupa quase toda a
   * largura — não há espaço vazio entre uma imagem e a próxima para cruzar de
   * um lado a outro sem passar por cima do texto. Por isso o contorno
   * esquerda/direita acontece DENTRO da própria imagem (escondido atrás
   * dela, onde ainda não há texto): primeiro até o centro exato da imagem,
   * depois — ainda escondido, entre o centro e o fim dela — desliza até a
   * lateral (10px de margem), de onde desce reto ao lado do texto até a
   * próxima imagem. No último produto, a linha termina exatamente no centro
   * da imagem — não continua até o fim do texto.
   */
  private buildStackedPoints(rows: RowGeometry[], origin: Point): Point[] {
    if (rows.length === 0) {
      return [];
    }

    const points: Point[] = [origin];
    let seed = 0;
    const lastIndex = rows.length - 1;

    rows.forEach((row, index) => {
      const mediaCenter: Point = { x: row.mediaCenterX, y: row.mediaCenterY };

      points.push(...sampleGapWave(points[points.length - 1], mediaCenter, WAVE_X_AMPLITUDE, seed++));
      points.push(mediaCenter);

      if (index === lastIndex) {
        return;
      }

      const afterMedia: Point = { x: row.anchorX, y: row.mediaBottom };
      const exit: Point = { x: row.anchorX, y: row.exitY };

      points.push(...sampleGapWave(mediaCenter, afterMedia, WAVE_X_AMPLITUDE, seed++));
      points.push(afterMedia, exit);
    });

    return points;
  }
}
