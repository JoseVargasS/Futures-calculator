import { useEffect, useRef, useState, useCallback } from "react";
import { mexcFetch } from "@/lib/mexc";
import { normalizeSym } from "@/lib/symbols";
import type { Exchange, Market } from "./useSymbols";

export function useLivePrice(symbol: string, exchange: Exchange, market: Market) {
  const [price, setPrice] = useState<number>(0);
  const [changePct, setChangePct] = useState<number>(0);
  const wsRef = useRef<WebSocket | null>(null);
  const pollRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {
        // ignore
      }
      wsRef.current = null;
    }
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const update = useCallback((p: number, pct: number) => {
    if (isFinite(p)) setPrice(p);
    if (isFinite(pct)) setChangePct(pct);
  }, []);

  const fetchMexcTicker = useCallback(
    async (sym: string) => {
      try {
        if (market === "FUTURES") {
          const r = await mexcFetch(`https://api.mexc.com/api/v1/contract/ticker?symbol=${sym}`);
          const j = (await r.json()) as { data: { lastPrice: string; riseFallRate: string } };
          const d = j.data;
          const last = parseFloat(d.lastPrice);
          const pct = parseFloat(d.riseFallRate) * 100;
          if (isFinite(last)) update(last, isFinite(pct) ? pct : 0);
        } else {
          const tvSym = sym.replace("_", "");
          const r = await mexcFetch(`https://api.mexc.com/api/v3/ticker/24hr?symbol=${tvSym}`);
          const d = (await r.json()) as Record<string, unknown>;
          const o = Array.isArray(d)
            ? (d as Array<Record<string, string>>).find((x) => normalizeSym(x.symbol) === normalizeSym(tvSym))
            : (d as Record<string, string>);
          if (!o) return;
          const last = parseFloat((o.lastPrice as string) ?? (o.lastprice as string) ?? (o.price as string));
          const pctRaw = parseFloat((o.priceChangePercent as string) ?? (o.change_rate as string) ?? "0");
          const pctNorm = Math.abs(pctRaw) < 1 && Math.abs(pctRaw) > 0 ? pctRaw * 100 : pctRaw;
          if (isFinite(last)) update(last, isFinite(pctNorm) ? pctNorm : 0);
        }
      } catch {
        // ignore
      }
    },
    [market, update],
  );

  const connectBinance = useCallback(
    (sym: string) => {
      stop();
      const isFutures = market === "FUTURES";
      const streamName = sym.replace("_", "").toLowerCase() + "@ticker";
      const url = isFutures
        ? `wss://fstream.binance.com/ws/${streamName}`
        : `wss://stream.binance.com:9443/ws/${streamName}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data as string);
        const last = parseFloat(data.c);
        const pct = parseFloat(data.P);
        update(last, pct);
      };
    },
    [market, stop, update],
  );

  const connectMexcFuturesWs = useCallback(
    (sym: string) => {
      stop();
      const ws = new WebSocket("wss://contract.mexc.com/edge");
      wsRef.current = ws;
      ws.onopen = () => {
        ws.send(JSON.stringify({ method: "sub.ticker", param: { symbol: sym } }));
        pollRef.current = window.setInterval(() => {
          try {
            ws.send(JSON.stringify({ method: "ping" }));
          } catch {
            // ignore
          }
        }, 20000);
      };
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data as string) as Record<string, unknown>;
          if ((msg as { method?: string }).method === "ping") {
            ws.send(JSON.stringify({ method: "pong" }));
            return;
          }
          if ((msg as { channel?: string }).channel === "pong") return;
          const d = (msg.data ?? msg) as { lastPrice?: string; riseFallRate?: string; symbol?: string };
          if (d?.lastPrice != null) {
            if (d.symbol && normalizeSym(d.symbol) !== normalizeSym(sym)) return;
            const last = parseFloat(d.lastPrice);
            const pct = parseFloat(d.riseFallRate ?? "0") * 100;
            if (isFinite(last)) update(last, isFinite(pct) ? pct : 0);
          }
        } catch {
          // ignore
        }
      };
      ws.onerror = () => {
        stop();
        fetchMexcTicker(sym);
        pollRef.current = window.setInterval(() => fetchMexcTicker(sym), 3000);
      };
      ws.onclose = () => {
        if (pollRef.current) window.clearInterval(pollRef.current);
      };
    },
    [fetchMexcTicker, stop, update],
  );

  const connectMexcPoll = useCallback(
    (sym: string) => {
      stop();
      fetchMexcTicker(sym);
      pollRef.current = window.setInterval(() => fetchMexcTicker(sym), 3000);
    },
    [fetchMexcTicker, stop],
  );

  useEffect(() => {
    if (!symbol) return;
    if (exchange === "MEXC") {
      if (market === "FUTURES") connectMexcFuturesWs(symbol);
      else connectMexcPoll(symbol);
    } else {
      connectBinance(symbol);
    }
    return stop;
  }, [symbol, exchange, market, connectBinance, connectMexcFuturesWs, connectMexcPoll, stop]);

  return { price, changePct };
}
