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

const MEXC_SPOT_DETAIL = {
  symbols: [
    { symbol: "BTCUSDT", quoteAsset: "USDT", status: "ENABLED", isSpotTradingAllowed: true },
    { symbol: "SUIUSDT", quoteAsset: "USDT", status: "ENABLED", isSpotTradingAllowed: true },
    { symbol: "DISABLEDUSDT", quoteAsset: "USDT", status: "DISABLED", isSpotTradingAllowed: true },
  ],
};

const BINANCE_SPOT = {
  symbols: [
    { symbol: "BTCUSDT", quoteAsset: "USDT", status: "TRADING", isSpotTradingAllowed: true },
    { symbol: "ETHUSDT", quoteAsset: "USDT", status: "TRADING", isSpotTradingAllowed: true },
    { symbol: "BNBUSDT", quoteAsset: "USDT", status: "TRADING", isSpotTradingAllowed: false },
  ],
};

const BINANCE_FUTURES = {
  symbols: [
    { symbol: "BTCUSDT", quoteAsset: "USDT", status: "TRADING", contractType: "PERPETUAL" },
    { symbol: "ETHUSDT", quoteAsset: "USDT", status: "TRADING", contractType: "PERPETUAL" },
    { symbol: "BTCUSD_PERP", quoteAsset: "USD", status: "TRADING", contractType: "PERPETUAL" },
    { symbol: "DELIVERY", quoteAsset: "USDT", status: "TRADING", contractType: "CURRENT_QUARTER" },
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

  it("MEXC SPOT filtra ENABLED y USDT", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(new Response(JSON.stringify(MEXC_SPOT_DETAIL), { status: 200 }));
    const { result } = renderHook(() => useSymbols("MEXC", "SPOT"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.symbols).toEqual(["BTCUSDT", "SUIUSDT"]);
  });

  it("BINANCE SPOT filtra isSpotTradingAllowed", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(new Response(JSON.stringify(BINANCE_SPOT), { status: 200 }));
    const { result } = renderHook(() => useSymbols("BINANCE", "SPOT"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.symbols).toEqual(["BTCUSDT", "ETHUSDT"]);
  });

  it("BINANCE FUTURES filtra PERPETUAL USDT", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(new Response(JSON.stringify(BINANCE_FUTURES), { status: 200 }));
    const { result } = renderHook(() => useSymbols("BINANCE", "FUTURES"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.symbols).toEqual(["BTCUSDT", "ETHUSDT"]);
  });

  it("fallback MEXC 1027 si fetch falla (usa MEXC_FUTURES_FALLBACK)", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));
    const { result } = renderHook(() => useSymbols("MEXC", "FUTURES"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.symbols.length).toBeGreaterThan(1000);
    expect(result.current.symbols).toContain("BTC_USDT");
    expect(result.current.symbols).toContain("SUI_USDT");
  });

  it("fallback via ticker cuando detail falla pero ticker ok (MEXC FUTURES)", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    fetchSpy.mockImplementation(async (url) => {
      const u = decodeURIComponent(String(url));
      if (u.includes("contract/detail")) return new Response("err", { status: 403 });
      if (u.includes("contract/ticker")) {
        return new Response(JSON.stringify({ success: true, data: [{ symbol: "BTC_USDT" }, { symbol: "SUI_USDT" }] }), { status: 200 });
      }
      return new Response(JSON.stringify({ success: true, data: [] }), { status: 200 });
    });
    const { result } = renderHook(() => useSymbols("MEXC", "FUTURES"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.symbols).toEqual(["BTC_USDT", "SUI_USDT"]);
  });

  it("fallback via ticker para BINANCE SPOT cuando exchangeInfo falla", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    fetchSpy.mockImplementation(async (url) => {
      const u = String(url);
      if (u.includes("exchangeInfo")) return new Response("err", { status: 429 });
      if (u.includes("ticker/price")) {
        return new Response(JSON.stringify([{ symbol: "BTCUSDT" }, { symbol: "SUIUSDT" }]), { status: 200 });
      }
      return new Response("err", { status: 500 });
    });
    const { result } = renderHook(() => useSymbols("BINANCE", "SPOT"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.symbols).toEqual(["BTCUSDT", "SUIUSDT"]);
  });

  it("fallback via ticker para MEXC SPOT y BINANCE FUTURES", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    // MEXC SPOT: exchangeInfo 403 -> ticker/price ok
    fetchSpy.mockImplementation(async (url) => {
      const u = decodeURIComponent(String(url));
      if (u.includes("exchangeInfo") && u.includes("api.mexc.com")) return new Response("err", { status: 403 });
      if (u.includes("ticker/price") && u.includes("api.mexc.com")) {
        return new Response(JSON.stringify([{ symbol: "BTCUSDT" }, { symbol: "PEPEUSDT" }]), { status: 200 });
      }
      return new Response("err", { status: 500 });
    });
    const { result: r1 } = renderHook(() => useSymbols("MEXC", "SPOT"));
    await waitFor(() => expect(r1.current.loading).toBe(false));
    expect(r1.current.symbols).toEqual(["BTCUSDT", "PEPEUSDT"]);

    vi.restoreAllMocks();
    const fetchSpy2 = vi.spyOn(global, "fetch");
    fetchSpy2.mockImplementation(async (url) => {
      const u = String(url);
      if (u.includes("fapi") && u.includes("exchangeInfo")) return new Response("err", { status: 429 });
      if (u.includes("fapi") && u.includes("ticker/price")) {
        return new Response(JSON.stringify([{ symbol: "BTCUSDT" }]), { status: 200 });
      }
      return new Response("err", { status: 500 });
    });
    const { result: r2 } = renderHook(() => useSymbols("BINANCE", "FUTURES"));
    await waitFor(() => expect(r2.current.loading).toBe(false));
    expect(r2.current.symbols).toEqual(["BTCUSDT"]);
  });
});
