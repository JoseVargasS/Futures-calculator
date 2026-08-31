import type { Exchange, Market } from "@/hooks/useSymbols";
import { AssetPicker } from "./AssetPicker/AssetPicker";

type Props = {
  exchange: Exchange;
  market: Market;
  symbols: string[];
  currentSymbol: string;
  onExchangeChange: (e: Exchange) => void;
  onMarketChange: (m: Market) => void;
  onSymbolChange: (s: string) => void;
};

export function Header({ exchange, market, symbols, currentSymbol, onExchangeChange, onMarketChange, onSymbolChange }: Props) {
  return (
    <header className="sticky top-0 z-50 border-b border-binanceBorder bg-binanceCard/90 px-2 py-3 shadow-md backdrop-blur-md lg:px-3">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 animate-pulse rounded-full bg-accentYellow" />
            <h1 className="text-lg font-black tracking-wide text-white">FUTURES PRO</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="flex items-center rounded-lg border border-binanceBorder bg-binanceBg p-0.5">
            <button
              onClick={() => onExchangeChange("MEXC")}
              className={`rounded-md px-2.5 py-1 text-[11px] font-black ${exchange === "MEXC" ? "bg-accentYellow text-black shadow" : "text-gray-400 hover:text-white"}`}
            >
              MEXC
            </button>
            <button
              onClick={() => onExchangeChange("BINANCE")}
              className={`rounded-md px-2.5 py-1 text-[11px] font-black ${exchange === "BINANCE" ? "bg-accentYellow text-black shadow" : "text-gray-400 hover:text-white"}`}
            >
              BINANCE
            </button>
          </div>

          <div className="flex items-center rounded-lg border border-binanceBorder bg-binanceBg p-0.5">
            <button
              onClick={() => onMarketChange("FUTURES")}
              className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${market === "FUTURES" ? "border border-gray-700 bg-binanceInput text-accentYellow" : "text-gray-400 hover:text-white"}`}
            >
              FUTURES
            </button>
            <button
              onClick={() => onMarketChange("SPOT")}
              className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${market === "SPOT" ? "border border-gray-700 bg-binanceInput text-accentYellow" : "text-gray-400 hover:text-white"}`}
            >
              SPOT
            </button>
          </div>

          <AssetPicker symbols={symbols} value={currentSymbol} market={market} onSelect={onSymbolChange} />
        </div>
      </div>
    </header>
  );
}
