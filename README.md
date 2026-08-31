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

## Uso

1. Arriba elige **MEXC / BINANCE** y **FUTURES / SPOT** (por defecto `MEXC FUTURES`).
2. En el buscador escribe `BTC`, `SUI`, `PEPE` — se filtra en vivo, `Enter` o click para elegir. En futuros ves `SUIUSDT` sin slash.
3. Mira **Precio Live** arriba a la izquierda (viene por WebSocket de MEXC `wss://contract.mexc.com/edge` o Binance) y dale a **Fijar Entrada** para copiarlo.
4. En la calculadora elige **LONG/SHORT**, pon **Margen** y **Apalancamiento** (1x-50x), ajusta **Entrada**, **Take Profit** y **Stop Loss** (o cambia a **Modo ROE %**).
5. Abajo ves **Valor Posición**, **Liquidación estimada**, **Ganancia TP**, **Pérdida SL** y **Ratio Riesgo/Beneficio** con badge `EXCELENTE / ACEPTABLE / DESFAVORABLE`.
6. A la derecha el **Gráfico TradingView** ya viene con `SMA` y `RSI` — usa la barra lateral izquierda para trazar líneas, Fibo y demás (ahora habilitada). Cambia `ES ↔ EN` arriba a la derecha, se guarda en tu navegador.

Tip: pares chicos `< $1` muestran 4 decimales y 4 dígitos significativos (ej: `0.00004231`) para no perder precisión.

## Scripts

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc && vite build → dist/
npm run preview
npm run test:run # 64 tests
```
