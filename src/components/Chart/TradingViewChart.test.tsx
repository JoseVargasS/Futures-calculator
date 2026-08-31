import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { TradingViewChart } from "./TradingViewChart";

describe("TradingViewChart", () => {
  it("crea widget MEXC con símbolo sin _ y opts de dibujo", () => {
    render(<TradingViewChart symbol="SUI_USDT" exchange="MEXC" />);
    // @ts-expect-error mock
    const opts = window.__mockTradingViewLastOpts() as Record<string, unknown>;
    expect(opts.symbol).toBe("MEXC:SUIUSDT");
    expect(opts.hide_side_toolbar).toBe(false);
    expect(opts.allow_symbol_change).toBe(true);
    expect(opts.interval).toBe("15");
  });

  it("BINANCE prefix", () => {
    render(<TradingViewChart symbol="BTCUSDT" exchange="BINANCE" />);
    // @ts-expect-error mock
    const opts = window.__mockTradingViewLastOpts() as Record<string, unknown>;
    expect(opts.symbol).toBe("BINANCE:BTCUSDT");
  });
});
