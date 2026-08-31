import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

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
  it("renderiza header, ticker, calculadora y gráfico", async () => {
    render(<App />);
    expect(screen.getByText("FUTURES PRO")).toBeInTheDocument();
    expect(screen.getByText("Precio Live MEXC — FUTURES")).toBeInTheDocument();
    expect(screen.getByText("Gráfico Técnico Interactivo")).toBeInTheDocument();
    expect(screen.getByText("Calculadora de Operación")).toBeInTheDocument();
  });

  it("cambia exchange y market", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByText("BINANCE"));
    await user.click(screen.getByText("SPOT"));
    expect(screen.getByText("Precio Live BINANCE — SPOT")).toBeInTheDocument();
  });

  it("busca SUI y cambia símbolo", async () => {
    const user = userEvent.setup();
    render(<App />);
    const input = screen.getByPlaceholderText("BTCUSDT");
    await user.click(input);
    await user.type(input, "sui");
    await waitFor(() => expect(screen.getByText("SUIUSDT")).toBeInTheDocument());
    await user.click(screen.getByText("SUIUSDT"));
    await waitFor(() => expect(screen.getByDisplayValue("SUIUSDT")).toBeInTheDocument());
  });
});
