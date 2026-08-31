import { useEffect, useState, useCallback } from "react";
import { mexcFetch } from "@/lib/mexc";
import { MEXC_FUTURES_FALLBACK } from "@/data/mexcFallback";

export type Exchange = "MEXC" | "BINANCE";
export type Market = "FUTURES" | "SPOT";

async function fetchMexcFuturesSymbols(): Promise<string[]> {
  const r = await mexcFetch("https://api.mexc.com/api/v1/contract/detail");
  if (!r.ok) throw new Error(`mexc futures ${r.status}`);
  const j = (await r.json()) as { data: Array<{ quoteCoin: string; state: number; futureType: number; isHidden: boolean; symbol: string }> };
  const arr = Array.isArray(j.data) ? j.data : j.data ? [j.data as unknown as { quoteCoin: string; state: number; futureType: number; isHidden: boolean; symbol: string }] : [];
  return arr
    .filter((c) => c.quoteCoin === "USDT" && c.state === 0 && c.futureType === 1 && !c.isHidden)
    .map((c) => c.symbol)
    .sort();
}

async function fetchMexcSpotSymbols(): Promise<string[]> {
  const r = await mexcFetch("https://api.mexc.com/api/v3/exchangeInfo");
  if (!r.ok) throw new Error(`mexc spot ${r.status}`);
  const j = (await r.json()) as { symbols: Array<{ status: string; quoteAsset: string; isSpotTradingAllowed: boolean; symbol: string }> };
  const syms = (j.symbols || [])
    .filter((s) => s.status === "ENABLED" && s.quoteAsset === "USDT" && s.isSpotTradingAllowed)
    .map((s) => s.symbol)
    .sort();
  if (syms.length) return syms;
  return (j.symbols || []).filter((s) => s.quoteAsset === "USDT").map((s) => s.symbol).sort();
}

async function fetchBinanceSpotSymbols(): Promise<string[]> {
  const r = await fetch("https://api.binance.com/api/v3/exchangeInfo");
  if (!r.ok) throw new Error(`binance spot ${r.status}`);
  const j = (await r.json()) as { symbols: Array<{ status: string; quoteAsset: string; isSpotTradingAllowed: boolean; symbol: string }> };
  return (j.symbols || [])
    .filter((s) => s.status === "TRADING" && s.quoteAsset === "USDT" && s.isSpotTradingAllowed)
    .map((s) => s.symbol)
    .sort();
}

async function fetchBinanceFuturesSymbols(): Promise<string[]> {
  const r = await fetch("https://fapi.binance.com/fapi/v1/exchangeInfo");
  if (!r.ok) throw new Error(`binance futures ${r.status}`);
  const j = (await r.json()) as { symbols: Array<{ status: string; quoteAsset: string; contractType: string; symbol: string }> };
  return (j.symbols || [])
    .filter((s) => s.status === "TRADING" && s.quoteAsset === "USDT" && s.contractType === "PERPETUAL")
    .map((s) => s.symbol)
    .sort();
}

function getFallback(exchange: Exchange, market: Market): string[] {
  const isMexc = exchange === "MEXC";
  const isFut = market === "FUTURES";
  const fallbackFut = isMexc ? MEXC_FUTURES_FALLBACK : ["BTCUSDT", "ETHUSDT", "SOLUSDT"];
  const fallbackSpot = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT"];
  return isFut ? fallbackFut : fallbackSpot;
}

export function useSymbols(exchange: Exchange, market: Market) {
  const [symbols, setSymbols] = useState<string[]>(() => getFallback(exchange, market));
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const isMexc = exchange === "MEXC";
    const isFut = market === "FUTURES";
    const fallback = getFallback(exchange, market);

    try {
      let syms: string[] = [];
      if (isMexc && isFut) syms = await fetchMexcFuturesSymbols();
      else if (isMexc && !isFut) syms = await fetchMexcSpotSymbols();
      else if (!isMexc && isFut) syms = await fetchBinanceFuturesSymbols();
      else syms = await fetchBinanceSpotSymbols();
      setSymbols(syms.length ? syms : fallback);
    } catch {
      try {
        if (isMexc && isFut) {
          const r2 = await mexcFetch("https://api.mexc.com/api/v1/contract/ticker");
          const j2 = (await r2.json()) as { data: Array<{ symbol: string }> };
          const list = Array.isArray(j2.data) ? j2.data : [];
          const syms2 = list.map((x) => x.symbol).filter((s) => s.endsWith("_USDT")).sort();
          setSymbols(syms2.length ? syms2 : fallback);
        } else if (isMexc) {
          const r2 = await mexcFetch("https://api.mexc.com/api/v3/ticker/price");
          const j2 = (await r2.json()) as Array<{ symbol: string }>;
          const syms2 = j2.map((x) => x.symbol).filter((s) => s.endsWith("USDT")).sort();
          setSymbols(syms2.length ? syms2 : fallback);
        } else if (isFut) {
          const r2 = await fetch("https://fapi.binance.com/fapi/v1/ticker/price");
          const j2 = (await r2.json()) as Array<{ symbol: string }>;
          setSymbols(j2.map((x) => x.symbol).filter((s) => s.endsWith("USDT")).sort() || fallback);
        } else {
          const r2 = await fetch("https://api.binance.com/api/v3/ticker/price");
          const j2 = (await r2.json()) as Array<{ symbol: string }>;
          setSymbols(j2.map((x) => x.symbol).filter((s) => s.endsWith("USDT")).sort() || fallback);
        }
      } catch {
        setSymbols(fallback);
      }
    } finally {
      setLoading(false);
    }
  }, [exchange, market]);

  useEffect(() => {
    load();
  }, [load]);

  return { symbols, loading, reload: load };
}
