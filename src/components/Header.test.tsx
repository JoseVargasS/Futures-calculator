import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Header } from "./Header";
import { I18nProvider } from "@/i18n/context";

describe("Header", () => {
  beforeEach(() => localStorage.clear());

  it("muestra toggles y llama callbacks", async () => {
    const user = userEvent.setup();
    const onEx = vi.fn();
    const onMk = vi.fn();
    const onSym = vi.fn();
    render(
      <Header
        exchange="MEXC"
        market="FUTURES"
        symbols={["BTC_USDT", "SUI_USDT"]}
        currentSymbol="BTCUSDT"
        onExchangeChange={onEx}
        onMarketChange={onMk}
        onSymbolChange={onSym}
      />,
    );
    expect(screen.getByText("FUTURES PRO")).toBeInTheDocument();
    await user.click(screen.getByText("BINANCE"));
    expect(onEx).toHaveBeenCalledWith("BINANCE");
    await user.click(screen.getByText("MEXC"));
    expect(onEx).toHaveBeenCalledWith("MEXC");
    await user.click(screen.getByText("SPOT"));
    expect(onMk).toHaveBeenCalledWith("SPOT");
    await user.click(screen.getByText("FUTURES"));
    expect(onMk).toHaveBeenCalledWith("FUTURES");
  });

  it("cambia símbolo vía AssetPicker", async () => {
    const user = userEvent.setup();
    const onSym = vi.fn();
    render(
      <Header
        exchange="MEXC"
        market="FUTURES"
        symbols={["BTC_USDT", "SUI_USDT", "ETH_USDT"]}
        currentSymbol="BTCUSDT"
        onExchangeChange={vi.fn()}
        onMarketChange={vi.fn()}
        onSymbolChange={onSym}
      />,
    );
    await user.click(screen.getByPlaceholderText(/BTCUSDT/));
    await user.type(screen.getByPlaceholderText("Buscar SUI, BTC..."), "sui");
    await user.click(screen.getByText("SUIUSDT"));
    expect(onSym).toHaveBeenCalledWith("SUI_USDT");
  });

  it("cambia idioma ES ↔ EN", async () => {
    const user = userEvent.setup();
    render(
      <I18nProvider>
        <Header
          exchange="MEXC"
          market="FUTURES"
          symbols={["BTC_USDT"]}
          currentSymbol="BTCUSDT"
          onExchangeChange={vi.fn()}
          onMarketChange={vi.fn()}
          onSymbolChange={vi.fn()}
        />
      </I18nProvider>,
    );
    await user.click(screen.getByText("EN"));
    expect(localStorage.getItem("lang")).toBe("en");
    await user.click(screen.getByText("ES"));
    expect(localStorage.getItem("lang")).toBe("es");
  });
});
