import { describe, it, expect } from "vitest";
import { normalizeSym, displaySym, displayInputSym, toTvSymbol } from "./symbols";

describe("normalizeSym", () => {
  it("upper + quita _, /, espacios", () => {
    expect(normalizeSym(" btc_usdt ")).toBe("BTCUSDT");
    expect(normalizeSym("SUI/USDT")).toBe("SUIUSDT");
    expect(normalizeSym("btcusdt")).toBe("BTCUSDT");
    expect(normalizeSym("BTC_USDT")).toBe("BTCUSDT");
  });
  it("null/empty", () => {
    expect(normalizeSym("")).toBe("");
    expect(normalizeSym(null as unknown as string)).toBe("");
  });
});

describe("displaySym", () => {
  it("FUTURES sin slash", () => {
    expect(displaySym("BTC_USDT", "FUTURES")).toBe("BTCUSDT");
    expect(displaySym("SUI_USDT", "FUTURES")).toBe("SUIUSDT");
    expect(displaySym("BTCUSDT", "FUTURES")).toBe("BTCUSDT");
  });
  it("SPOT con slash", () => {
    expect(displaySym("BTCUSDT", "SPOT")).toBe("BTC / USDT");
    expect(displaySym("BTC_USDT", "SPOT")).toBe("BTC / USDT");
    expect(displaySym("ETHUSDT", "SPOT")).toBe("ETH / USDT");
  });
});

describe("displayInputSym", () => {
  it("siempre quita _", () => {
    expect(displayInputSym("BTC_USDT")).toBe("BTCUSDT");
    expect(displayInputSym("BTCUSDT")).toBe("BTCUSDT");
    expect(displayInputSym("SUI_USDT")).toBe("SUIUSDT");
  });
});

describe("toTvSymbol", () => {
  it("strip _ para TradingView", () => {
    expect(toTvSymbol("BTC_USDT")).toBe("BTCUSDT");
    expect(toTvSymbol("BTCUSDT")).toBe("BTCUSDT");
  });
});
