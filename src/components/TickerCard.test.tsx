import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TickerCard } from "./TickerCard";

describe("TickerCard", () => {
  it("muestra precio formateado y %", () => {
    render(<TickerCard exchange="MEXC" market="FUTURES" price={77493.7} changePct={-1.64} />);
    expect(screen.getByText("Precio Live MEXC — FUTURES")).toBeInTheDocument();
    expect(screen.getByText("$77,493.70")).toBeInTheDocument();
    expect(screen.getByText("-1.64%")).toBeInTheDocument();
  });
  it("precio <1 con 4 decimales", () => {
    render(<TickerCard exchange="MEXC" market="FUTURES" price={0.00004231} changePct={2} />);
    expect(screen.getByText("$0.00004231")).toBeInTheDocument();
  });
  it("price 0 muestra --", () => {
    render(<TickerCard exchange="BINANCE" market="SPOT" price={0} changePct={0} />);
    expect(screen.getByText("$--.--")).toBeInTheDocument();
  });
  it("botón Fijar Entrada dispara evento", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    let fired = false;
    window.addEventListener("fix-entry", () => (fired = true));
    render(<TickerCard exchange="MEXC" market="FUTURES" price={65000} changePct={0} />);
    await user.click(screen.getByText("Fijar Entrada"));
    expect(fired).toBe(true);
  });
});
