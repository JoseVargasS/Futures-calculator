import { describe, it, expect } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { TradingViewChart } from "./TradingViewChart";

describe("TradingViewChart", () => {
  it("crea widget MEXC con símbolo sin _ y opts de dibujo", async () => {
    render(<TradingViewChart symbol="SUI_USDT" exchange="MEXC" />);
    await waitFor(() => {
      const opts = (window as unknown as { __mockTradingViewLastOpts: () => Record<string, unknown> }).__mockTradingViewLastOpts() as Record<string, unknown>;
      expect(opts.symbol).toBe("MEXC:SUIUSDT");
    });
    const opts = (window as unknown as { __mockTradingViewLastOpts: () => Record<string, unknown> }).__mockTradingViewLastOpts() as Record<string, unknown>;
    expect(opts.hide_side_toolbar).toBe(false);
    expect(opts.allow_symbol_change).toBe(true);
    expect(opts.interval).toBe("15");
  });

  it("BINANCE prefix", async () => {
    render(<TradingViewChart symbol="BTCUSDT" exchange="BINANCE" />);
    await waitFor(() => {
      const opts = (window as unknown as { __mockTradingViewLastOpts: () => Record<string, unknown> }).__mockTradingViewLastOpts() as Record<string, unknown>;
      expect(opts.symbol).toBe("BINANCE:BTCUSDT");
    });
  });

  it("no crea widget si container no existe", () => {
    document.getElementById("tradingview_container")?.remove();
    // no debe lanzar
    expect(() => render(<TradingViewChart symbol="BTCUSDT" exchange="MEXC" />)).not.toThrow();
  });

  it("no crea widget si TradingView no está", () => {
    const prev = window.TradingView;
    // @ts-ignore delete mock
    delete (window as unknown as { TradingView?: unknown }).TradingView;
    const { container } = render(<div id="tradingview_container" />);
    // el componente busca por id global, no usa container, así que solo verifica early return
    expect(() => render(<TradingViewChart symbol="BTCUSDT" exchange="BINANCE" />)).not.toThrow();
    window.TradingView = prev;
    container.remove();
  });
});
