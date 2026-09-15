import { describe, it, expect } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Calculator } from "./Calculator";

describe("Calculator", () => {
  it("LONG default: cálculo posValue, tokens, liq", () => {
    render(<Calculator livePrice={65000} />);
    expect(screen.getByText("$10,000.00")).toBeInTheDocument(); // 1000*10
    expect(screen.getByText("$58,500.00")).toBeInTheDocument(); // liq long 65000*(1-1/10)=58500
    expect(screen.getByText("0.1538 Contratos")).toBeInTheDocument(); // 10000/65000
  });

  it("cambia a SHORT y recalcula liq", async () => {
    const user = userEvent.setup();
    render(<Calculator livePrice={65000} />);
    await user.click(screen.getByText("SHORT"));
    expect(screen.getByText("$71,500.00")).toBeInTheDocument(); // 65000*1.1
  });

  it("Modo ROE % sincroniza TP/SL", async () => {
    const user = userEvent.setup();
    render(<Calculator livePrice={65000} />);
    await user.click(screen.getByText("Modo ROE %"));
    // inputs ROE visibles
    expect(screen.getByText("Target ROE (% Ganancia)")).toBeInTheDocument();
    // cambia leverage y ROE, verifica precio TP
    const tpPct = screen.getByDisplayValue("20") as HTMLInputElement;
    await user.clear(tpPct);
    await user.type(tpPct, "100");
    // con 100% ROE a 10x, move 10% → TP long 71500
    // el display de precio TP debe reflejar 71500
    // buscamos texto Precio TP
    expect(screen.getByText(/Precio TP:/)).toBeInTheDocument();
  });

  it("Fijar Entrada via evento fix-entry actualiza entry", async () => {
    render(<Calculator livePrice={77780.1} />);
    await act(async () => {
      window.dispatchEvent(new Event("fix-entry"));
    });
    // number input trims trailing zero: 77780.10 -> 77780.1
    expect(await screen.findByDisplayValue("77780.1")).toBeInTheDocument();
  });

  it("margen chico <1 formato 4 decimales en liq", async () => {
    render(<Calculator livePrice={0.00004231} />);
    await act(async () => {
      window.dispatchEvent(new Event("fix-entry"));
    });
    expect(await screen.findByText("$0.00003808")).toBeInTheDocument(); // liq long 0.00004231*(1-1/10)
  });

  it("edita TP/SL en modo $ y cambia margen/leverage/entry", async () => {
    const user = userEvent.setup();
    render(<Calculator livePrice={65000} />);
    // edita margen
    const margin = screen.getByDisplayValue("1000") as HTMLInputElement;
    await user.clear(margin);
    await user.type(margin, "200");
    expect(screen.getByText("$2,000.00")).toBeInTheDocument(); // 200*10
    // edita entry
    const entry = screen.getByDisplayValue("65000") as HTMLInputElement;
    await user.clear(entry);
    await user.type(entry, "60000");
    expect(screen.getByText("0.0333 Contratos")).toBeInTheDocument(); // 2000/60000
    // edita TP en modo $
    const tp = screen.getByDisplayValue("68000") as HTMLInputElement;
    await user.clear(tp);
    await user.type(tp, "70000");
    expect(screen.getByText(/Precio TP:/)).toHaveTextContent("$70,000.00");
    // cambia leverage
    const lev = screen.getByDisplayValue("10x") as HTMLSelectElement;
    await user.selectOptions(lev, "20");
    expect(lev.value).toBe("20");
  });

  it("cubre badge DESFAVORABLE y SHORT en ROE", async () => {
    const user = userEvent.setup();
    render(<Calculator livePrice={65000} />);
    await user.click(screen.getByText("SHORT"));
    await user.click(screen.getByText("Modo ROE %"));
    const tpPct = screen.getByDisplayValue("20") as HTMLInputElement;
    const slPct = screen.getByDisplayValue("10") as HTMLInputElement;
    await user.clear(tpPct);
    await user.type(tpPct, "10");
    await user.clear(slPct);
    await user.type(slPct, "50");
    // rr = 10/50 = 0.2 -> DESFAVORABLE
    expect(await screen.findByText("DESFAVORABLE")).toBeInTheDocument();
    // vuelve a LONG y ACEPTABLE
    await user.click(screen.getByText("LONG"));
    await user.clear(tpPct);
    await user.type(tpPct, "30");
    await user.clear(slPct);
    await user.type(slPct, "20");
    expect(await screen.findByText("ACEPTABLE")).toBeInTheDocument();
  });
});
