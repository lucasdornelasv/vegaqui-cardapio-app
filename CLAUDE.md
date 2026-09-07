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
