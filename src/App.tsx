import { useState, useEffect, useDeferredValue, useCallback, useMemo } from "react";
import { Header } from "@/components/Header";
import { TickerCard } from "@/components/TickerCard";
import { Calculator } from "@/components/Calculator/Calculator";
import { TradingViewChart } from "@/components/Chart/TradingViewChart";
import { useSymbols, type Exchange, type Market } from "@/hooks/useSymbols";
import { useLivePrice } from "@/hooks/useLivePrice";
import { normalizeSym, displayInputSym } from "@/lib/symbols";
import { useI18n } from "@/i18n/context";

export default function App() {
  const { t, lang } = useI18n();
  const deferredLang = useDeferredValue(lang);
  const [exchange, setExchange] = useState<Exchange>("MEXC");
  const [market, setMarket] = useState<Market>("FUTURES");
  const [symbol, setSymbol] = useState("BTCUSDT");

  const { symbols } = useSymbols(exchange, market);

  // canonical para WS y TradingView (MEXC conserva _ ) — memoizado
  const canonicalSymbol = useMemo(() => {
    const norm = normalizeSym(symbol);
    const found = symbols.find((s) => normalizeSym(s) === norm);
    return found ?? symbol;
  }, [symbol, symbols]);

  const { price, changePct } = useLivePrice(canonicalSymbol, exchange, market);

  // keep symbol valid when symbols list changes — solo si no existe, evita recarga doble
  useEffect(() => {
    if (symbols.length === 0) return;
    const norm = normalizeSym(symbol);
    const found = symbols.find((s) => normalizeSym(s) === norm);
    if (!found) {
      setSymbol(displayInputSym(symbols[0]));
    }
  }, [symbols]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSymbolChange = useCallback(
    (raw: string) => {
      const found = symbols.find((s) => normalizeSym(s) === normalizeSym(raw));
      setSymbol(found ? displayInputSym(found) : raw);
    },
    [symbols],
  );

  const handleExchange = useCallback((e: Exchange) => {
    setExchange(e);
  }, []);

  const handleMarket = useCallback((m: Market) => {
    setMarket(m);
  }, []);

  // tvSymbol ya es canonical — locale diferido para no bloquear UI
  const tvSymbol = canonicalSymbol;
  const chartLocale = deferredLang;

  return (
    <div className="min-h-screen bg-binanceBg pb-10">
      <Header
        exchange={exchange}
        market={market}
        symbols={symbols}
        currentSymbol={symbol}
        onExchangeChange={handleExchange}
        onMarketChange={handleMarket}
        onSymbolChange={handleSymbolChange}
      />

      <main className="mx-auto w-full max-w-[1600px] px-2 pt-3 sm:px-3 lg:px-4">
        <div className="grid grid-cols-1 items-stretch gap-2.5 lg:grid-cols-12 lg:gap-3">
          <div className="space-y-2.5 lg:col-span-4 xl:col-span-3">
            <TickerCard exchange={exchange} market={market} price={price} changePct={changePct} />
            <Calculator livePrice={price} />
          </div>

          <div className="flex flex-col space-y-4 lg:col-span-8 xl:col-span-9">
            <section className="animate-rise flex flex-1 flex-col space-y-3 rounded-xl border border-white/10 bg-surface p-3 shadow-xl sm:p-4" style={{ ["--rise-delay" as string]: "160ms" }}>
              <div className="flex items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 shrink-0 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12H4z" /></svg>
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-white">{t.chart.title}</h2>
                </div>
                <div className="flex gap-1.5">
                  <span className="tnum rounded-full bg-field px-2 py-0.5 text-[10px] font-bold text-gray-400">{t.chart.sma}</span>
                  <span className="tnum rounded-full bg-field px-2 py-0.5 text-[10px] font-bold text-gray-400">{t.chart.rsiVol}</span>
                </div>
              </div>
              <TradingViewChart symbol={tvSymbol} exchange={exchange} locale={chartLocale} />
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
