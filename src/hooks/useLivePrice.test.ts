import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useLivePrice } from "./useLivePrice";

class MockWs {
  static last: MockWs | null = null;
  url: string;
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;
  sent: string[] = [];
  constructor(url: string) {
    this.url = url;
    MockWs.last = this;
  }
  send(d: string) { this.sent.push(d); }
  close() { this.onclose?.(); }
  triggerOpen() { this.onopen?.(); }
  triggerMessage(data: unknown) { this.onmessage?.({ data: JSON.stringify(data) }); }
}

describe("useLivePrice", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    MockWs.last = null;
    global.WebSocket = MockWs as unknown as typeof WebSocket;
    vi.spyOn(global, "fetch").mockImplementation(() => Promise.reject(new Error("not polled")));
  });

  it("BINANCE SPOT conecta a stream.binance.com", async () => {
    const { result } = renderHook(() => useLivePrice("BTCUSDT", "BINANCE", "SPOT"));
    await waitFor(() => expect(MockWs.last?.url).toContain("stream.binance.com"));
    expect(MockWs.last?.url).toContain("btcusdt@ticker");
    // simula push
    MockWs.last?.triggerMessage({ c: "65000.50", P: "1.52" });
    await waitFor(() => expect(result.current.price).toBe(65000.5));
    expect(result.current.changePct).toBe(1.52);
  });

  it("BINANCE FUTURES usa fstream", async () => {
    renderHook(() => useLivePrice("ETHUSDT", "BINANCE", "FUTURES"));
    await waitFor(() => expect(MockWs.last?.url).toContain("fstream.binance.com"));
  });

  it("MEXC FUTURES sub.ticker y parsea lastPrice/riseFallRate", async () => {
    const { result } = renderHook(() => useLivePrice("SUI_USDT", "MEXC", "FUTURES"));
    await waitFor(() => expect(MockWs.last?.url).toBe("wss://contract.mexc.com/edge"));
    MockWs.last?.triggerOpen();
    expect(MockWs.last?.sent[0]).toContain("sub.ticker");
    expect(MockWs.last?.sent[0]).toContain("SUI_USDT");
    MockWs.last?.triggerMessage({ channel: "push.ticker", data: { symbol: "SUI_USDT", lastPrice: "0.7042", riseFallRate: "0.0123" } });
    await waitFor(() => expect(result.current.price).toBe(0.7042));
    expect(result.current.changePct).toBeCloseTo(1.23);
  });

  it("MEXC SPOT hace poll REST si no es FUTURES", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(new Response(JSON.stringify({ success: true, data: { lastPrice: "1.23", riseFallRate: "0.01" } }), { status: 200 }));
    renderHook(() => useLivePrice("BTCUSDT", "MEXC", "SPOT"));
    // para SPOT usa poll, no WS futures -> espera fetch
    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
  });

  it("filtra mensaje con símbolo distinto y maneja ping/pong", async () => {
    const { result } = renderHook(() => useLivePrice("BTC_USDT", "MEXC", "FUTURES"));
    await waitFor(() => expect(MockWs.last?.url).toBe("wss://contract.mexc.com/edge"));
    MockWs.last?.triggerOpen();
    // ping -> debe responder pong
    MockWs.last?.triggerMessage({ method: "ping" });
    expect(MockWs.last?.sent).toContain(JSON.stringify({ method: "pong" }));
    // pong channel ignorado
    MockWs.last?.triggerMessage({ channel: "pong" });
    // mensaje con símbolo distinto ignorado
    MockWs.last?.triggerMessage({ data: { symbol: "ETH_USDT", lastPrice: "999", riseFallRate: "0.05" } });
    await new Promise((r) => setTimeout(r, 10));
    expect(result.current.price).toBe(0);
    // mensaje válido
    MockWs.last?.triggerMessage({ data: { symbol: "BTC_USDT", lastPrice: "123", riseFallRate: "0.01" } });
    await waitFor(() => expect(result.current.price).toBe(123));
  });

  it("WS onerror hace fallback a poll", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(new Response(JSON.stringify({ success: true, data: { lastPrice: "77780", riseFallRate: "0.01" } }), { status: 200 }));
    const { result } = renderHook(() => useLivePrice("BTC_USDT", "MEXC", "FUTURES"));
    await waitFor(() => expect(MockWs.last?.url).toBe("wss://contract.mexc.com/edge"));
    MockWs.last?.onerror?.();
    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    // onclose limpia intervalo
    MockWs.last?.onclose?.();
    expect(result.current.price).toBeDefined();
  });

  it("ignora símbolo vacío", async () => {
    renderHook(() => useLivePrice("", "MEXC", "FUTURES"));
    await new Promise((r) => setTimeout(r, 20));
    expect(MockWs.last).toBeNull();
  });
});
