import { memo } from "react";
import type { Exchange, Market } from "@/hooks/useSymbols";
import { AssetPicker } from "./AssetPicker/AssetPicker";
import { useI18n } from "@/i18n/context";

type Props = {
  exchange: Exchange;
  market: Market;
  symbols: string[];
  currentSymbol: string;
  onExchangeChange: (e: Exchange) => void;
  onMarketChange: (m: Market) => void;
  onSymbolChange: (s: string) => void;
};

export const Header = memo(function Header({ exchange, market, symbols, currentSymbol, onExchangeChange, onMarketChange, onSymbolChange }: Props) {
  const { lang, setLang, isPending } = useI18n() as ReturnType<typeof useI18n> & { isPending?: boolean };
  const segBtn =
    "min-h-8 rounded-full px-2.5 py-1 text-[11px] font-bold transition-all duration-200 ease-out-expo active:scale-[0.97]";
  return (
    <header className="glass-fixed sticky top-0 z-50 border-b border-white/10 px-2 py-2 sm:py-2.5 lg:px-3">
      <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center gap-x-1.5 gap-y-2 md:flex-nowrap">
        <div className="flex shrink-0 items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white" aria-hidden="true">
            <svg className="h-4 w-4 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2z" /></svg>
          </span>
          <h1 className="text-[15px] font-extrabold tracking-tight text-white">FUTURES PRO</h1>
          <span className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-accentGreen min-[400px]:flex" aria-hidden="true">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accentGreen" />
            LIVE
          </span>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-0.5 rounded-full bg-field p-1 md:ml-0" role="group" aria-label="Exchange">
            <button
              onClick={() => onExchangeChange("MEXC")}
              aria-pressed={exchange === "MEXC"}
              className={`${segBtn} ${exchange === "MEXC" ? "bg-white font-extrabold text-black" : "text-gray-400 hover:bg-white/10 hover:text-white"}`}
            >
              MEXC
            </button>
            <button
              onClick={() => onExchangeChange("BINANCE")}
              aria-pressed={exchange === "BINANCE"}
              className={`${segBtn} ${exchange === "BINANCE" ? "bg-white font-extrabold text-black" : "text-gray-400 hover:bg-white/10 hover:text-white"}`}
            >
              BINANCE
            </button>
          </div>

          <div className="flex w-full min-w-0 items-center gap-1.5 md:w-auto">
          <div className="flex shrink-0 items-center gap-0.5 rounded-full bg-field p-1" role="group" aria-label="Market">
            <button
              onClick={() => onMarketChange("FUTURES")}
              aria-pressed={market === "FUTURES"}
              className={`${segBtn} ${market === "FUTURES" ? "bg-white/15 font-extrabold text-white" : "text-gray-400 hover:bg-white/10 hover:text-white"}`}
            >
              FUTURES
            </button>
            <button
              onClick={() => onMarketChange("SPOT")}
              aria-pressed={market === "SPOT"}
              className={`${segBtn} ${market === "SPOT" ? "bg-white/15 font-extrabold text-white" : "text-gray-400 hover:bg-white/10 hover:text-white"}`}
            >
              SPOT
            </button>
          </div>

          <div className="flex items-center gap-0.5 rounded-full bg-field p-1" role="group" aria-label="Language">
            <button
              onClick={() => setLang("es")}
              aria-pressed={lang === "es"}
              disabled={!!isPending}
              className={`${segBtn} transition-opacity ${isPending ? "opacity-50" : ""} ${lang === "es" ? "bg-white/15 text-white" : "text-gray-400 hover:bg-white/10 hover:text-white"}`}
            >
              ES
            </button>
            <button
              onClick={() => setLang("en")}
              aria-pressed={lang === "en"}
              disabled={!!isPending}
              className={`${segBtn} transition-opacity ${isPending ? "opacity-50" : ""} ${lang === "en" ? "bg-white/15 text-white" : "text-gray-400 hover:bg-white/10 hover:text-white"}`}
            >
              EN
            </button>
          </div>

          <AssetPicker symbols={symbols} value={currentSymbol} market={market} onSelect={onSymbolChange} />
          </div>
        </div>
    </header>
  );
});
