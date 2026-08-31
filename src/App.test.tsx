import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { I18nProvider } from "./i18n/context";

vi.mock("./hooks/useSymbols", async (importOriginal) => {
  const mod = await importOriginal() as Record<string, unknown>;
  return {
    ...mod,
    useSymbols: () => ({ symbols: ["BTC_USDT", "SUI_USDT", "PEPE_USDT"], loading: false, reload: vi.fn() }),
  };
});

vi.mock("./hooks/useLivePrice", () => ({
  useLivePrice: () => ({ price: 77780.1, changePct: -1.23 }),
}));

describe("App", () => {
  beforeEach(() => localStorage.clear());
  const renderApp = () => render(<I18nProvider><App /></I18nProvider>);

  it("renderiza header, ticker, calculadora y gráfico", async () => {
    renderApp();
    expect(screen.getByText("FUTURES PRO")).toBeInTheDocument();
    expect(screen.getByText("Precio Live MEXC — FUTURES")).toBeInTheDocument();
    expect(screen.getByText("Gráfico Técnico Interactivo")).toBeInTheDocument();
    expect(screen.getByText("Calculadora de Operación")).toBeInTheDocument();
  });

  it("cambia exchange y market", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByText("BINANCE"));
    await user.click(screen.getByText("SPOT"));
    expect(screen.getByText("Precio Live BINANCE — SPOT")).toBeInTheDocument();
  });

  it("busca SUI y cambia símbolo", async () => {
    const user = userEvent.setup();
    renderApp();
    const input = screen.getByPlaceholderText(/BTCUSDT/);
    await user.click(input);
    await user.type(input, "sui");
    await waitFor(() => expect(screen.getByText("SUIUSDT")).toBeInTheDocument());
    await user.click(screen.getByText("SUIUSDT"));
    await waitFor(() => expect(screen.getByDisplayValue("SUIUSDT")).toBeInTheDocument());
  });

  it("cambia idioma a inglés", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByText("EN"));
    await waitFor(() => expect(screen.getByText("Live Price MEXC — FUTURES")).toBeInTheDocument());
    expect(screen.getByText("Trading Calculator")).toBeInTheDocument();
    expect(screen.getByText("Interactive Technical Chart")).toBeInTheDocument();
    await user.click(screen.getByText("ES"));
    await waitFor(() => expect(screen.getByText("Precio Live MEXC — FUTURES")).toBeInTheDocument());
  });
});
