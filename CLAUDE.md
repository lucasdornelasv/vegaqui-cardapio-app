# Convenções do projeto

## Prefira referências via injeção de dependência (Angular)

Este projeto usa Angular SSR (`provideClientHydration`, `@angular/ssr`). Sempre que existir um
token de injeção do Angular para uma referência global do browser, use-o em vez do global direto:

- `document` → injete `DOCUMENT` de `@angular/common` (`inject(DOCUMENT)`).
- Prefira os serviços do Angular (`Location`, `Router`, etc.) a `window.history`/`window.location`
  quando cobrirem o caso de uso.

Por quê: código que referencia `document`/`window` diretamente quebra ou exige guards manuais ao
rodar durante o SSR (Node não tem esses globais). Injetar o token do Angular deixa o código
testável e permite que o Angular resolva a referência correta em cada plataforma automaticamente.

APIs do navegador sem token de injeção no Angular (`IntersectionObserver`, `ResizeObserver`, etc.)
continuam ok de usar diretamente, desde que só rodem no browser — use `afterNextRender`/
`afterEveryRender` para isso (eles não executam durante o SSR).

## Prefira implementações desacopladas

Evite um componente acessar diretamente a estrutura DOM/interna de outro (ex.: `querySelector`
buscando classes de outro componente, `ElementRef.nativeElement.parentElement.querySelectorAll(...)`
subindo/descendo na árvore). Quando um componente precisa colaborar com outro(s) sem conhecer sua
implementação:

- Defina o contrato como uma **classe abstrata** (funciona como interface TypeScript e como token
  de injeção ao mesmo tempo — é o padrão do Angular/CDK para isso).
- O componente que fornece os dados a implementa e se registra sob esse token via
  `providers: [{ provide: MinhaAbstrata, useExisting: MeuComponente }]`.
- Quem precisa consumir usa uma **diretiva** (`inject(MinhaAbstrata)`) aplicada junto ao componente
  provedor, que se registra num serviço injetável escopado por uma diretiva de contexto ancestral
  (`providers: [MeuRegistro]` na diretiva de contexto) — em vez de o consumidor sair caçando
  elementos pela árvore do DOM.

Exemplo no código: `src/app/shared/components/vine-connector/` — `VineConnectableProduct` e
`VineOrigin` são os contratos; `VineConnectableProductDirective`/`VineOriginDirective` registram os
componentes-host num `VineConnectorRegistry` provido por `VineConnectorContextDirective`
(`vineConnectorContext`, um por categoria); `VineConnectorComponent` só enxerga o registro, nunca o
DOM de `ProductCardComponent`/`CategoryBannerComponent` diretamente.

Por quê: acoplar via `querySelector` quebra silenciosamente se a classe/estrutura interna do outro
componente mudar, e impede reuso (outro componente que quisesse participar teria que reproduzir a
mesma estrutura DOM). Registro via DI + contrato explícito torna a colaboração opcional, testável
e resiliente a mudanças internas de qualquer um dos lados.
