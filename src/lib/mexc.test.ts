import { describe, it, expect, vi, beforeEach } from "vitest";
import { mexcFetch } from "./mexc";

describe("mexcFetch", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("MEXC va proxy-first (sin intento directo que ensucie consola con CORS)", async () => {
    const ok = new Response(JSON.stringify({ success: true }), { status: 200 });
    const spy = vi.spyOn(global, "fetch").mockResolvedValueOnce(ok);
    const r = await mexcFetch("https://api.mexc.com/api/v1/contract/detail");
    expect(r.ok).toBe(true);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(String(spy.mock.calls[0][0])).toContain("api.allorigins.win");
  });

  it("prueba corsproxy.io si allorigins falla", async () => {
    const bad = new Response("err", { status: 403 });
    const proxOk = new Response(JSON.stringify({ success: true }), { status: 200 });
    const spy = vi.spyOn(global, "fetch").mockResolvedValueOnce(bad).mockResolvedValueOnce(proxOk);
    const r = await mexcFetch("https://api.mexc.com/api/v1/contract/ticker?symbol=BTC_USDT");
    expect(r.ok).toBe(true);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(String(spy.mock.calls[1][0])).toContain("corsproxy.io");
  });

  it("lanza si toda la cadena falla", async () => {
    const spy = vi.spyOn(global, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(mexcFetch("https://api.mexc.com/api/v3/exchangeInfo")).rejects.toThrow();
    expect(spy).toHaveBeenCalledTimes(3);
  });

  it("usa r.jina.ai como último eslabón y extrae el JSON del markdown", async () => {
    const bad = new Response("err", { status: 403 });
    const jina = new Response('Title:\n\nURL Source: x\nMarkdown Content:\n{"success":true,"code":0}', { status: 200 });
    const spy = vi.spyOn(global, "fetch").mockResolvedValueOnce(bad).mockRejectedValueOnce(new TypeError("no")).mockResolvedValueOnce(jina);
    const r = await mexcFetch("https://api.mexc.com/api/v1/contract/detail");
    expect(r.ok).toBe(true);
    expect(spy).toHaveBeenCalledTimes(3);
    expect(await r.json()).toEqual({ success: true, code: 0 });
  });

  it("host no-MEXC va directo primero", async () => {
    const ok = new Response(JSON.stringify({ success: true }), { status: 200 });
    const spy = vi.spyOn(global, "fetch").mockResolvedValueOnce(ok);
    const r = await mexcFetch("https://api.binance.com/api/v3/exchangeInfo");
    expect(r.ok).toBe(true);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(String(spy.mock.calls[0][0])).toBe("https://api.binance.com/api/v3/exchangeInfo");
  });
});
