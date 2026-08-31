import { describe, it, expect } from "vitest";
import { decimalsForPrice, fmtPrice, fmtPriceInput } from "./formatPrice";

describe("decimalsForPrice", () => {
  it(">=1 usa 2 decimales", () => {
    expect(decimalsForPrice(1)).toBe(2);
    expect(decimalsForPrice(65000)).toBe(2);
    expect(decimalsForPrice(1.0001)).toBe(2);
  });
  it("mínimo 4 decimales para <1", () => {
    expect(decimalsForPrice(0.85)).toBe(4);
    expect(decimalsForPrice(0.5)).toBe(4);
    expect(decimalsForPrice(0.9999)).toBe(4);
  });
  it("4 dígitos significativos: ceros iniciales aumentan decimales", () => {
    expect(decimalsForPrice(0.085)).toBe(5); // 0.08500
    expect(decimalsForPrice(0.0085)).toBe(6);
    expect(decimalsForPrice(0.004567)).toBe(6);
    expect(decimalsForPrice(0.00004231)).toBe(8);
    expect(decimalsForPrice(0.0000001234)).toBe(10);
    expect(decimalsForPrice(0.0001)).toBe(7); // 0.0001000
  });
  it("cap 20", () => {
    expect(decimalsForPrice(1e-30)).toBe(20);
  });
  it("no-finite", () => {
    expect(decimalsForPrice(NaN)).toBe(4);
    expect(decimalsForPrice(Infinity)).toBe(4);
  });
});

describe("fmtPrice", () => {
  it(">=1 con locale 2 decimales y signo $", () => {
    expect(fmtPrice(65000)).toBe("$65,000.00");
    expect(fmtPrice(1.5)).toBe("$1.50");
    expect(fmtPrice(1000)).toBe("$1,000.00");
  });
  it("cero es $0.00", () => {
    expect(fmtPrice(0)).toBe("$0.00");
    expect(fmtPrice(NaN)).toBe("$0.00");
  });
  it("<1 mínimo 4 decimales", () => {
    expect(fmtPrice(0.85)).toBe("$0.8500");
    expect(fmtPrice(0.5)).toBe("$0.5000");
  });
  it("4 sig: ejemplos de spec", () => {
    expect(fmtPrice(0.004567)).toBe("$0.004567");
    expect(fmtPrice(0.00004231)).toBe("$0.00004231");
    expect(fmtPrice(0.0000001234)).toBe("$0.0000001234");
    expect(fmtPrice(0.085)).toBe("$0.08500");
  });
  it("redondea a 4 sig", () => {
    expect(fmtPrice(0.0045678)).toBe("$0.004568");
    expect(fmtPrice(0.0045671)).toBe("$0.004567");
  });
  it("0.0001000 mantiene trailing zeros", () => {
    expect(fmtPrice(0.0001)).toBe("$0.0001000");
  });
});

describe("fmtPriceInput", () => {
  it("sin $, >=1 2 decimales", () => {
    expect(fmtPriceInput(65000)).toBe("65000.00");
    expect(fmtPriceInput(1)).toBe("1.00");
  });
  it("<1 con 4 sig", () => {
    expect(fmtPriceInput(0.85)).toBe("0.8500");
    expect(fmtPriceInput(0.004567)).toBe("0.004567");
  });
  it("livePrice * 1.03 para SUI-like", () => {
    expect(fmtPriceInput(0.85 * 1.03)).toBe("0.8755");
  });
  it("cero", () => {
    expect(fmtPriceInput(0)).toBe("0.0000");
  });
});
