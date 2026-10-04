# DESIGN.md — SetRack landing (dirección cerrada, 2026-10-04)

## Concepto (una frase)
La página está hecha del material del gimnasio: tiza, acero moleteado,
discos calibrados, pizarra de pesos. Nada decorativo que no sea hierro.

## Paleta (un acento, bloqueado en toda la página)
- `--negro: #0B0C0E` fondo. `--hueso: #EDE8E1` texto principal.
- `--acero: #9BA3AB` texto secundario. `--rojo: #F2555A` ÚNICO acento
  (discos, CTA primario, datos clave). Nada más lleva color.
- Prohibido: morados/azules IA, degradados en titulares, neones, glassmorphism.

## Tipo (3 roles, sin excepción)
- Display: **Anton** (OFL, self-host `fonts/anton-latin-400.woff2` + `OFL.txt`).
  Solo H1 y títulos de sección, mayúsculas, `line-height ≥ 1`, tracking apretado.
  Regla de aire: toda máscara/reveal deja `padding-bottom ≥ .12em`.
- Cuerpo: sans del sistema (legibilidad; nada de condensada en párrafos).
- Números: **Space Mono** (OFL, self-host 400+700) para TODO número
  (kg, series, 0·0·0·0, stats). Sin mono decorativo en prosa.

## Textura
- Grano fílmico: `feTurbulence` en data-URI sobre pseudo-elemento fijo,
  `opacity ≤ .1`, `pointer-events: none`. Nunca sobre contenedores con scroll.
- Divisores con patrón de moleteado CSS (repeating-linear-gradient 45°).

## Composición
- Hero cabe en el primer viewport: `padding-top ≤ 96px`, H1 máx 2 líneas,
  sub máx 20 palabras, CTAs visibles sin scroll. La escena de la barra vive
  DENTRO del hero, no debajo.
- Directamente bajo el hero: strip de prueba (0 datos · 0 anuncios ·
  0 rastreadores · 61 ejercicios · es/en · kg/lb). Contenido, no padding.
- El scroll es una sesión: calentar → entrenar → progresar. Cada animación
  se justifica en una frase o se elimina. Máximo UNA marquesina con propósito.
- Ritmos distintos por sección: prohibido 3 tarjetas iguales, prohibido
  zigzag imagen-texto 3 veces seguidas, prohibido eyebrow en cada sección
  (máx 1 cada 3; el hero puede llevar el único kicker mono).

## Movimiento (solo CSS scroll-driven, sin librerías)
- `animation-timeline: view()` + `@supports`, fallback visible por defecto.
- Todo lo animado respeta `prefers-reduced-motion` (estático, nunca invisible).
- Solo `transform` y `opacity`. Contenido visible por defecto: prohibido
  `opacity: 0` inicial fuera de `no-preference`.

## Copy (español claro; registro único: hechos y números)
- Hero: promesa de resultado que solo SetRack puede decir
  («Apunta la serie en segundos en una app que ni puede conectarse a internet»
  o mantener H1 actual + sub de permiso).
- Secciones: `Qué pasa entre serie y serie` · `Todo sin salir del móvil` ·
  `No puede enviar tus datos` · `Antes de instalar` · `Gratis hoy. Tuyo siempre.`
- Palabras prohibidas: eleva, desata, revoluciona, sin esfuerzo, moderno,
  potente, innovador, perfecto, increíble, seamless/sin fisuras, robusto,
  desbloquea, siguiente nivel, reimagina, di adiós a, no es X es Y,
  no solo X sino Y, listas de noes. Test: si vale para Strong/Hevy, bórrala.
- CTAs: Ko-fi `https://ko-fi.com/iggykimi` primero (único enlace real);
  Play es `<span>` «Próximamente en Google Play» (SIN href: sin URL pública).

## Prohibiciones de contenido (claim-check)
- Nada de descargas APK. Nada de cifras inventadas: solo 61, es/en, kg/lb,
  0·0·0·0, versión 0.21. Nada de programas named (5/3/1) que la app no prescribe.
- Nada de fake-screenshots con divs: las 5 webp reales en `assets/img/`
  (560px, `width/height` explícitos, lazy salvo hero). Demo interactiva solo
  si es un mini-componente FUNCIONAL, no dibujo.
- Nada de conmutador JS de idioma: se mantiene la ruta `/en/` + hreflang.
- El número decorativo de la barra del hero lleva `aria-hidden="true"`.

## Preservar (intocable)
- URLs canónicas `/` y `/en/`, hreflang, sitemap, robots, llms.txt, OG.
- Ids `#app` y `#privacidad`, `main#contenido`, `a.saltar`, conmutador `en/`↔`../`.
- Bloque `details.legal` (fecha 3-oct-2026, 3 puntos, resumen EN) y `p.cero-datos`.
- Ko-fi ×4 y `github.com/iggykimi/setrack-web/issues` ×1 por idioma.
- SEO: title/description/OG/Twitter/JSON-LD/canonical por página.

## Verificación antes de publicar
1. Capturas Playwright 1440 + 390 (hero, mitad, final): sin recortes, sin vacíos muertos.
2. Claim-check: cada cifra visible existe en `docs/play/ficha-play.md` o en código.
3. En vivo: `/`, `/en/`, webp, sitemap, robots, llms.txt → 200; privacidad viva.
