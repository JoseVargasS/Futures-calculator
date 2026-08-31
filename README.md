# Futures Pro — MEXC / Binance (Vite + React + TS)

Calculadora de futuros con buscador universal, live price WS/polling y gráfico TradingView. Migración desde un monolito `calculadora_futuros_v2.html` (vanilla + Tailwind CDN) a stack moderno.

## Stack 2026

- **Vite 6 + React 19 + TypeScript 5.7** (ESM, HMR, `StrictMode`)
- **Tailwind CSS 4** vía `@tailwindcss/vite` (tokens en `src/index.css` con `@theme`)
- **ESLint + typescript-eslint + Prettier + prettier-plugin-tailwindcss**
- **Path alias** `@/*` → `src/*`
- **TradingView `tv.js` widget** (cdn) con `hide_side_toolbar: false` para dibujos

## Estructura

```
├── index.html                 # entry Vite
├── vite.config.ts             # @tailwindcss/vite + @vitejs/plugin-react + alias
├── tsconfig.json
├── src/
│   ├── main.tsx               # React root
│   ├── App.tsx                # layout, toggles, composición
│   ├── index.css              # @import tailwindcss + @theme + scrollbar
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── TickerCard.tsx
│   │   ├── AssetPicker/
│   │   │   └── AssetPicker.tsx
│   │   ├── Calculator/
│   │   │   └── Calculator.tsx
│   │   └── Chart/
│   │       └── TradingViewChart.tsx
│   ├── hooks/
│   │   ├── useSymbols.ts      # MEXC/BINANCE × FUTURES/SPOT, fallback 1027 pares
│   │   └── useLivePrice.ts    # Binance WS / MEXC WS (edge) + poll fallback
│   ├── lib/
│   │   ├── formatPrice.ts     # decimalsForPrice, fmtPrice (4 sig digits < $1)
│   │   ├── symbols.ts         # normalizeSym, displaySym, toTvSymbol
│   │   └── mexc.ts            # mexcFetch con corsproxy.io fallback
│   └── data/
│       └── mexcFallback.ts    # snapshot MEXC futures (1027) para CORS
└── legacy/                    # monolito original archivado
```

## Flujo

- **Exchange/Market** (`MEXC|BINANCE` × `FUTURES|SPOT`) → `useSymbols` elige endpoint:
  - `MEXC FUTURES` → `GET /api/v1/contract/detail` (filtra `quoteCoin=USDT`, `state=0`)
  - `MEXC SPOT` → `GET /api/v3/exchangeInfo`
  - `BINANCE FUTURES` → `fapi/binance` / `BINANCE SPOT` → `api/binance`
  - Fallback local `MEXC_FUTURES_FALLBACK` si CORS bloquea
- **Buscador** (`AssetPicker`) — input se limpia al focus, filtra con `normalizeSym` en vivo, 80 items + `+N más`, teclado ↑/↓/Enter/Esc, `SUIUSDT` sin slash en futuros
- **Live price** (`useLivePrice`)
  - Binance → `wss://stream.binance.com` / `fstream.binance.com`
  - MEXC FUTURES → `wss://contract.mexc.com/edge` (`sub.ticker` + ping)
  - MEXC SPOT → poll `mexcFetch` 3s
- **Precio** — `< $1` → mínimo 4 decimales y 4 dígitos significativos (`decimalsForPrice = -floor(log10)+3`)
- **Gráfico** — `MEXC:` / `BINANCE:` + `withdateranges`, `hide_side_toolbar: false` para trazos

## Scripts

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc && vite build → dist/
npm run preview
```

## Migración desde legacy

`legacy/calculadora_futuros_v2.html` + `style.css` + `app.js` movidos a `legacy/`. El nuevo `index.html` es el entry minimal de Vite; `src/` separa CSS (`index.css` + `@theme`) y JS (hooks/lib/components).

## Próximos pasos sugeridos

- Añadir `zustand` o `jotai` si crece el estado
- Tests: `vitest` + `react-testing-library` para `formatPrice` y `useLivePrice`
- `shadcn/ui` si se quiere sistema de componentes consistente
