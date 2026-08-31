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

  it("no crea widget si container no existe", () => {
    document.getElementById("tradingview_container")?.remove();
    // no debe lanzar
    expect(() => render(<TradingViewChart symbol="BTCUSDT" exchange="MEXC" />)).not.toThrow();
  });

  it("no crea widget si TradingView no está", () => {
    const prev = window.TradingView;
    // @ts-expect-error delete mock
    delete window.TradingView;
    const { container } = render(<div id="tradingview_container" />);
    // el componente busca por id global, no usa container, así que solo verifica early return
    expect(() => render(<TradingViewChart symbol="BTCUSDT" exchange="BINANCE" />)).not.toThrow();
    window.TradingView = prev;
    container.remove();
  });
});
