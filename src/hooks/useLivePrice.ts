import { useEffect, useRef, useState, useCallback } from "react";
import { mexcFetch } from "@/lib/mexc";
import { normalizeSym } from "@/lib/symbols";
import type { Exchange, Market } from "./useSymbols";

export function useLivePrice(symbol: string, exchange: Exchange, market: Market) {
  const [price, setPrice] = useState<number>(0);
  const [changePct, setChangePct] = useState<number>(0);
  const wsRef = useRef<WebSocket | null>(null);
  const pollRef = useRef<number | null>(null);
  const pingRef = useRef<number | null>(null);
  const reconnectRef = useRef<number | null>(null);
  const watchdogRef = useRef<number | null>(null);
  const retryRef = useRef(0);
  const activeRef = useRef(true);

  const stop = useCallback(() => {
    const ws = wsRef.current;
    wsRef.current = null;
    if (ws) {
      try {
        ws.close();
      } catch {
        // ignore
      }
    }
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (pingRef.current) {
      window.clearInterval(pingRef.current);
      pingRef.current = null;
    }
    if (reconnectRef.current) {
      window.clearTimeout(reconnectRef.current);
      reconnectRef.current = null;
    }
    if (watchdogRef.current) {
      window.clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
  }, []);

  const update = useCallback((p: number, pct: number) => {
    if (isFinite(p)) setPrice(p);
    if (isFinite(pct)) setChangePct(pct);
  }, []);

  // ponytail: reconnect con backoff + watchdog que cae a poll si el WS se queda mudo
  const scheduleReconnect = useCallback(
    (fn: () => void) => {
      if (!activeRef.current || reconnectRef.current != null) return;
      const delay = Math.min(1000 * 2 ** retryRef.current, 10000);
      retryRef.current += 1;
      reconnectRef.current = window.setTimeout(() => {
        reconnectRef.current = null;
        if (!activeRef.current) return;
        fn();
      }, delay);
    },
    [],
  );

  const pokeWatchdog = useCallback(
    (onSilent: () => void, ms = 10000) => {
      if (watchdogRef.current) window.clearTimeout(watchdogRef.current);
      watchdogRef.current = window.setTimeout(() => {
        if (!activeRef.current) return;
        onSilent();
      }, ms);
    },
    [],
  );

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
      retryRef.current = 0;
      const isFutures = market === "FUTURES";
      const streamName = sym.replace("_", "").toLowerCase() + "@ticker";
      const url = isFutures
        ? `wss://fstream.binance.com/ws/${streamName}`
        : `wss://stream.binance.com:9443/ws/${streamName}`;
      const redo = () => connectBinance(sym);
      const ws = new WebSocket(url);
      wsRef.current = ws;
      const restFallback = async () => {
        try {
          const tvSym = sym.replace("_", "");
          const rest = isFutures
            ? `https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=${tvSym}`
            : `https://api.binance.com/api/v3/ticker/24hr?symbol=${tvSym}`;
          const r = await mexcFetch(rest);
          const d = (await r.json()) as { lastPrice?: string; priceChangePercent?: string };
          const last = parseFloat(d.lastPrice ?? "");
          const pct = parseFloat(d.priceChangePercent ?? "0");
          update(last, pct);
        } catch {
          // ignore — el watchdog/reintento sigue corriendo
        }
      };
      const onSilent = () => {
        if (!activeRef.current || wsRef.current !== ws) return;
        void restFallback();
        pokeWatchdog(onSilent);
        scheduleReconnect(redo);
      };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string);
          const last = parseFloat(data.c);
          const pct = parseFloat(data.P);
          update(last, pct);
          retryRef.current = 0;
          pokeWatchdog(onSilent);
        } catch {
          // ignore
        }
      };
      ws.onerror = () => {
        if (!activeRef.current) return;
        void restFallback();
        scheduleReconnect(redo);
      };
      ws.onclose = () => {
        if (!activeRef.current || wsRef.current !== ws) return;
        wsRef.current = null;
        if (watchdogRef.current) window.clearTimeout(watchdogRef.current);
        void restFallback();
        scheduleReconnect(redo);
      };
      pokeWatchdog(onSilent);
    },
    [market, stop, update, scheduleReconnect, pokeWatchdog],
  );

  const connectMexcFuturesWs = useCallback(
    (sym: string) => {
      stop();
      retryRef.current = 0;
      const redo = () => connectMexcFuturesWs(sym);
      const startPollFallback = () => {
        if (!activeRef.current || pollRef.current != null) return;
        void fetchMexcTicker(sym);
        pollRef.current = window.setInterval(() => fetchMexcTicker(sym), 3000);
      };
      const onSilent = () => {
        if (!activeRef.current) return;
        startPollFallback();
        pokeWatchdog(onSilent);
        scheduleReconnect(redo);
      };
      const ws = new WebSocket("wss://contract.mexc.com/edge");
      wsRef.current = ws;
      ws.onopen = () => {
        ws.send(JSON.stringify({ method: "sub.ticker", param: { symbol: sym } }));
        retryRef.current = 0;
        if (pingRef.current) window.clearInterval(pingRef.current);
        pingRef.current = window.setInterval(() => {
          try {
            ws.send(JSON.stringify({ method: "ping" }));
          } catch {
            // ignore
          }
        }, 20000);
        pokeWatchdog(onSilent);
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
            retryRef.current = 0;
            pokeWatchdog(onSilent);
          }
        } catch {
          // ignore
        }
      };
      const onDead = () => {
        if (!activeRef.current) return;
        if (pingRef.current) {
          window.clearInterval(pingRef.current);
          pingRef.current = null;
        }
        startPollFallback();
        scheduleReconnect(redo);
      };
      ws.onerror = onDead;
      ws.onclose = () => {
        if (!activeRef.current || wsRef.current !== ws) return;
        wsRef.current = null;
        onDead();
      };
      pokeWatchdog(onSilent);
    },
    [fetchMexcTicker, stop, update, scheduleReconnect, pokeWatchdog],
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
    activeRef.current = true;
    if (exchange === "MEXC") {
      if (market === "FUTURES") connectMexcFuturesWs(symbol);
      else connectMexcPoll(symbol);
    } else {
      connectBinance(symbol);
    }
    return () => {
      activeRef.current = false;
      stop();
    };
  }, [symbol, exchange, market, connectBinance, connectMexcFuturesWs, connectMexcPoll, stop]);

  return { price, changePct };
}
