import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useSymbols } from "./useSymbols";

const MEXC_FUTURES_DETAIL = {
  success: true,
  code: 0,
  data: [
    { symbol: "BTC_USDT", quoteCoin: "USDT", state: 0, futureType: 1, isHidden: false },
    { symbol: "SUI_USDT", quoteCoin: "USDT", state: 0, futureType: 1, isHidden: false },
    { symbol: "PEPE_USDT", quoteCoin: "USDT", state: 0, futureType: 1, isHidden: false },
    { symbol: "HIDDEN_USDT", quoteCoin: "USDT", state: 0, futureType: 1, isHidden: true },
    { symbol: "BTC_USD", quoteCoin: "USD", state: 0, futureType: 1, isHidden: false },
  ],
};

const BINANCE_SPOT = {
  symbols: [
    { symbol: "BTCUSDT", quoteAsset: "USDT", status: "TRADING", isSpotTradingAllowed: true },
    { symbol: "ETHUSDT", quoteAsset: "USDT", status: "TRADING", isSpotTradingAllowed: true },
    { symbol: "BNBUSDT", quoteAsset: "USDT", status: "TRADING", isSpotTradingAllowed: false },
  ],
};

describe("useSymbols", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("MEXC FUTURES filtra y ordena", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(new Response(JSON.stringify(MEXC_FUTURES_DETAIL), { status: 200 }));
    const { result } = renderHook(() => useSymbols("MEXC", "FUTURES"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.symbols).toEqual(["BTC_USDT", "PEPE_USDT", "SUI_USDT"]);
  });

  it("BINANCE SPOT filtra isSpotTradingAllowed", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(new Response(JSON.stringify(BINANCE_SPOT), { status: 200 }));
    const { result } = renderHook(() => useSymbols("BINANCE", "SPOT"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.symbols).toEqual(["BTCUSDT", "ETHUSDT"]);
  });

  it("fallback MEXC 1027 si fetch falla (usa MEXC_FUTURES_FALLBACK)", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));
    const { result } = renderHook(() => useSymbols("MEXC", "FUTURES"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    // debe caer al fallback importado (incluye BTC_USDT)
    expect(result.current.symbols.length).toBeGreaterThan(1000);
    expect(result.current.symbols).toContain("BTC_USDT");
    expect(result.current.symbols).toContain("SUI_USDT");
  });
});
