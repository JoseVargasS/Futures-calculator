import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { TickerCard } from "@/components/TickerCard";
import { Calculator } from "@/components/Calculator/Calculator";
import { TradingViewChart } from "@/components/Chart/TradingViewChart";
import { useSymbols, type Exchange, type Market } from "@/hooks/useSymbols";
import { useLivePrice } from "@/hooks/useLivePrice";
import { normalizeSym, displayInputSym } from "@/lib/symbols";

export default function App() {
  const [exchange, setExchange] = useState<Exchange>("MEXC");
  const [market, setMarket] = useState<Market>("FUTURES");
  const [symbol, setSymbol] = useState("BTCUSDT");

  const { symbols } = useSymbols(exchange, market);

  // canonical para WS y TradingView (MEXC conserva _ )
  const canonicalSymbol = (() => {
    const norm = normalizeSym(symbol);
    const found = symbols.find((s) => normalizeSym(s) === norm);
    return found ?? symbol;
  })();

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

  const handleSymbolChange = (raw: string) => {
    // raw is canonical like BTC_USDT or BTCUSDT, we store display form
    const found = symbols.find((s) => normalizeSym(s) === normalizeSym(raw));
    setSymbol(found ? displayInputSym(found) : raw);
  };

  const handleExchange = (e: Exchange) => {
    setExchange(e);
  };

  const handleMarket = (m: Market) => {
    setMarket(m);
  };

  // tvSymbol ya es canonical
  const tvSymbol = canonicalSymbol;

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

      <main className="w-full px-1 pt-3 sm:px-2 lg:px-3">
        <div className="grid grid-cols-1 items-stretch gap-2 lg:grid-cols-12 lg:gap-3">
          <div className="space-y-4 lg:col-span-4 xl:col-span-3">
            <TickerCard exchange={exchange} market={market} price={price} changePct={changePct} />
            <Calculator livePrice={price} />
          </div>

          <div className="flex flex-col space-y-4 lg:col-span-8 xl:col-span-9">
            <section className="flex flex-1 flex-col space-y-3 rounded-xl border border-binanceBorder bg-binanceCard p-3 shadow-xl sm:p-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-accentYellow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12H4z" /></svg>
                  <h2 className="text-xs font-bold uppercase tracking-wide text-gray-300">Gráfico Técnico Interactivo</h2>
                </div>
                <div className="flex gap-2">
                  <span className="rounded border border-gray-700 bg-binanceInput px-2 py-0.5 text-[10px] font-bold text-gray-400">SMA 50,75,100,150,200</span>
                  <span className="rounded border border-gray-700 bg-binanceInput px-2 py-0.5 text-[10px] font-bold text-gray-400">RSI & VOL</span>
                </div>
              </div>
              <TradingViewChart symbol={tvSymbol} exchange={exchange} />
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
