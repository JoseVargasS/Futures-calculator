import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AssetPicker } from "./AssetPicker";

const SYMBOLS = ["BTC_USDT", "ETH_USDT", "SUI_USDT", "PEPE_USDT", "SOL_USDT"];

describe("AssetPicker", () => {
  it("muestra pares y filtra en vivo mientras escribes", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<AssetPicker symbols={SYMBOLS} value="BTC_USDT" market="FUTURES" onSelect={onSelect} />);
    expect(screen.getByText("5 pares")).toBeInTheDocument();
    const input = screen.getByPlaceholderText(/BTCUSDT/) as HTMLInputElement;
    // focus limpia (vacía) y muestra lista completa
    await user.click(input);
    expect(input.value).toBe("");
    expect(screen.getByText("BTCUSDT")).toBeInTheDocument();
    // escribe SUI → solo SUIUSDT
    await user.type(input, "sui");
    expect(screen.getByText("SUIUSDT")).toBeInTheDocument();
    expect(screen.queryByText("BTCUSDT")).not.toBeInTheDocument();
    // Enter selecciona
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith("SUI_USDT");
  });

  it("FUTURES sin slash, SPOT con slash", async () => {
    const { rerender } = render(<AssetPicker symbols={SYMBOLS} value="BTC_USDT" market="FUTURES" onSelect={vi.fn()} />);
    expect(screen.getByDisplayValue("BTCUSDT")).toBeInTheDocument();
    rerender(<AssetPicker symbols={["BTCUSDT"]} value="BTCUSDT" market="SPOT" onSelect={vi.fn()} />);
    // SPOT display con slash en dropdown
    const user = userEvent.setup();
    await user.click(screen.getByPlaceholderText(/BTCUSDT/));
    // para SPOT el dropdown muestra "BTC / USDT"
    expect(screen.getByText("BTC / USDT")).toBeInTheDocument();
  });

  it("teclado ↓ ↑ selecciona", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<AssetPicker symbols={SYMBOLS} value="BTC_USDT" market="FUTURES" onSelect={onSelect} />);
    await user.click(screen.getByPlaceholderText(/BTCUSDT/));
    await user.type(screen.getByPlaceholderText("Buscar SUI, BTC...") || screen.getByPlaceholderText(/BTCUSDT/), "p");
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onSelect).toHaveBeenCalled();
  });
});
