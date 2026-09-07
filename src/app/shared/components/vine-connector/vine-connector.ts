import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterEveryRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { HorizontalSide } from '@common/horizontal-side';

// Fallback usado antes da primeira medição real no navegador (e durante o
// SSR, que nunca mede): assume uma fileira uniforme por produto, com a
// imagem alternando de lado como no layout lado a lado (desktop).
const FALLBACK_SEGMENT_HEIGHT = 100;
const FALLBACK_LEFT_X = 15;
const FALLBACK_RIGHT_X = 85;
const FALLBACK_ROW_HALF_SPAN_FRACTION = 0.25;

// Abaixo desse valor (em % da largura do contêiner), a margem livre de texto
// de um lado é considerada "estreita" — sinal de que o layout empilhou imagem
// e texto (mobile) em vez de colocá-los lado a lado (desktop): o texto ocupa
// quase toda a largura, e não sobra espaço ao lado dele para o traço passar.
const NARROW_GUTTER_THRESHOLD = 15;

// Fração da margem livre reservada como respiro extra antes do texto.
const GUTTER_SAFETY_MARGIN_FRACTION = 0.25;

const WAVE_X_AMPLITUDE = 22;
const WAVE_RISE_FRACTION = 0.35;

interface Point {
  x: number;
  y: number;
}

interface RowGeometry {
  /** Topo do produto (imagem ou texto, o que estiver mais acima), em px relativos ao topo do contêiner. */
  entryY: number;
  /** Fim da imagem — no layout empilhado, é onde o contorno esquerda/direita acontece (a imagem esconde a curva). */
  mediaBottom: number;
  /** Fim do produto (imagem ou texto, o que estiver mais abaixo). */
  exitY: number;
  /** Posição horizontal (0-100) do trecho reto ao lado do texto. */
  anchorX: number;
  /** Quanto a onda pode se afastar de `anchorX`, ao lado do texto, sem esbarrar nele. */
  amplitude: number;
}

interface Geometry {
  /** Empilhado (mobile): imagem acima do texto, ocupando quase toda a largura. */
  isStacked: boolean;
  rows: RowGeometry[];
}

function clamp(x: number): number {
  return Math.max(0, Math.min(100, x));
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

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const control1: Point = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const control2: Point = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };

    path += ` C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${p2.x} ${p2.y}`;
  }

  return path;
}

function uniformGeometry(sides: HorizontalSide[]): Geometry {
  const rows = sides.map((side, index) => {
    const center = (index + 0.5) * FALLBACK_SEGMENT_HEIGHT;
    const halfSpan = FALLBACK_SEGMENT_HEIGHT * FALLBACK_ROW_HALF_SPAN_FRACTION;

    return {
      entryY: center - halfSpan,
      mediaBottom: center,
      exitY: center + halfSpan,
      anchorX: side === 'left' ? FALLBACK_LEFT_X : FALLBACK_RIGHT_X,
      amplitude: WAVE_X_AMPLITUDE,
    };
  });

  return { isStacked: false, rows };
}

@Component({
  selector: 'vine-connector',
  templateUrl: './vine-connector.html',
  styleUrl: './vine-connector.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VineConnectorComponent {
  readonly sides = input<HorizontalSide[]>([]);

  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  // Vazio até a primeira medição real no navegador (nunca acontece durante
  // SSR); enquanto isso, `effectiveGeometry`/`viewBoxHeight` caem no fallback
  // uniforme acima.
  private readonly geometry = signal<Geometry | null>(null);
  private readonly containerHeight = signal(0);

  private resizeObserver?: ResizeObserver;
  private observedContainer: HTMLElement | null = null;

  readonly viewBoxHeight = computed(
    () => this.containerHeight() || this.sides().length * FALLBACK_SEGMENT_HEIGHT,
  );

  readonly path = computed(() => {
    const geometry = this.effectiveGeometry();
    const points = geometry.isStacked
      ? this.buildStackedPoints(geometry.rows)
      : this.buildRowPoints(geometry.rows);

    return toSmoothPath(points);
  });

  constructor() {
    // `afterEveryRender` só executa no navegador (nunca durante SSR). A
    // hidratação pode recriar o container logo após o primeiro render, então
    // reconferimos a cada render e trocamos o alvo observado se ele mudou —
    // o próprio ResizeObserver cuida de medir de novo sempre que o layout
    // real mudar (ex.: texto quebrando diferente em outra largura de tela).
    afterEveryRender(() => {
      const container = this.host.nativeElement.parentElement;
      if (!container || container === this.observedContainer) {
        return;
      }

      this.resizeObserver?.disconnect();
      this.resizeObserver = new ResizeObserver(() => this.measure(container));
      this.resizeObserver.observe(container);
      this.observedContainer = container;
    });

    this.destroyRef.onDestroy(() => this.resizeObserver?.disconnect());
  }

  private effectiveGeometry(): Geometry {
    const measured = this.geometry();
    return measured && measured.rows.length === this.sides().length
      ? measured
      : uniformGeometry(this.sides());
  }

  /**
   * Mede, para cada produto, a posição real da imagem (`.product-card__media`)
   * e do texto (`.product-card__content`) para nunca desenhar o traço por
   * cima do título/descrição/preço/botão — nem verticalmente (a altura do
   * texto varia bastante entre produtos) nem horizontalmente (a margem livre
   * ao lado do texto também varia conforme o layout).
   */
  private measure(container: HTMLElement): void {
    const sides = this.sides();
    const cards = Array.from(container.querySelectorAll<HTMLElement>(':scope > product-card'));
    const containerRect = container.getBoundingClientRect();
    this.containerHeight.set(containerRect.height);

    if (cards.length === 0) {
      this.geometry.set({ isStacked: false, rows: [] });
      return;
    }

    const toPercent = (px: number) => ((px - containerRect.left) / containerRect.width) * 100;

    const measured = cards.map((card) => {
      const media = card.querySelector<HTMLElement>('.product-card__media') ?? card;
      const content = card.querySelector<HTMLElement>('.product-card__content') ?? card;
      const mediaRect = media.getBoundingClientRect();
      const contentRect = content.getBoundingClientRect();

      return {
        // No layout lado a lado, imagem e texto ficam centralizados um contra
        // o outro (`align-items: center`): quando a descrição é longa, o
        // texto pode ficar mais alto que a imagem e se estender além dela.
        entryY: Math.min(mediaRect.top, contentRect.top) - containerRect.top,
        mediaBottom: mediaRect.bottom - containerRect.top,
        exitY: Math.max(mediaRect.bottom, contentRect.bottom) - containerRect.top,
        leftGutter: toPercent(contentRect.left),
        rightGutter: 100 - toPercent(contentRect.right),
      };
    });

    const isStacked = measured.every(
      (row) => Math.max(row.leftGutter, row.rightGutter) < NARROW_GUTTER_THRESHOLD,
    );

    const rows = measured.map((row, index) => {
      const preferLeft = sides[index] === 'left';
      const gutter = preferLeft ? row.leftGutter : row.rightGutter;
      const usable = Math.max(gutter * (1 - GUTTER_SAFETY_MARGIN_FRACTION), 1);

      return {
        entryY: row.entryY,
        mediaBottom: row.mediaBottom,
        exitY: row.exitY,
        anchorX: preferLeft ? usable / 2 : 100 - usable / 2,
        amplitude: Math.min(WAVE_X_AMPLITUDE, usable / 2),
      };
    });

    this.geometry.set({ isStacked, rows });
  }

  /**
   * Lado a lado (desktop): imagem e texto dividem a largura, então o trecho
   * reto cobre a fileira inteira (imagem + texto) num único X fixo, e a onda
   * de transição para o próximo produto acontece no espaço vazio entre uma
   * fileira e a próxima.
   */
  private buildRowPoints(rows: RowGeometry[]): Point[] {
    if (rows.length === 0) {
      return [];
    }

    const points: Point[] = [{ x: 0, y: 0 }];
    let seed = 0;
    let previousAmplitude = rows[0].amplitude;

    rows.forEach((row) => {
      const entry: Point = { x: row.anchorX, y: row.entryY };
      const exit: Point = { x: row.anchorX, y: row.exitY };
      // A onda de transição usa a margem mais apertada entre quem ela deixa
      // e quem ela alcança, para nunca ultrapassar o espaço livre ao lado do
      // texto de nenhum dos dois produtos.
      const transitAmplitude = Math.min(previousAmplitude, row.amplitude);

      points.push(...sampleGapWave(points[points.length - 1], entry, transitAmplitude, seed++));
      points.push(entry, exit);

      previousAmplitude = row.amplitude;
    });

    return points;
  }

  /**
   * Empilhado (mobile): a imagem fica acima do texto, que ocupa quase toda a
   * largura — não há espaço vazio entre uma imagem e a próxima para cruzar de
   * um lado a outro sem passar por cima do texto. Por isso o contorno
   * esquerda/direita acontece DENTRO da própria imagem (escondido atrás
   * dela, onde ainda não há texto), e só depois o traço desce reto, colado
   * na margem livre ao lado do texto, até a próxima imagem.
   */
  private buildStackedPoints(rows: RowGeometry[]): Point[] {
    if (rows.length === 0) {
      return [];
    }

    const points: Point[] = [{ x: 0, y: 0 }];
    let seed = 0;

    rows.forEach((row) => {
      const behindImage: Point = { x: row.anchorX, y: row.mediaBottom };
      const exit: Point = { x: row.anchorX, y: row.exitY };

      points.push(...sampleGapWave(points[points.length - 1], behindImage, WAVE_X_AMPLITUDE, seed++));
      points.push(behindImage, exit);
    });

    return points;
  }
}
