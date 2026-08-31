import { describe, it, expect, vi, beforeEach } from "vitest";
import { mexcFetch } from "./mexc";

describe("mexcFetch", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("retorna directo si ok", async () => {
    const ok = new Response(JSON.stringify({ success: true }), { status: 200 });
    vi.spyOn(global, "fetch").mockResolvedValueOnce(ok);
    const r = await mexcFetch("https://api.mexc.com/api/v1/contract/detail");
    expect(r.ok).toBe(true);
  });

  it("fallback a corsproxy.io si fetch lanza (CORS)", async () => {
    const fail = () => Promise.reject(new TypeError("Failed to fetch"));
    const proxOk = new Response(JSON.stringify({ success: true }), { status: 200 });
    const spy = vi.spyOn(global, "fetch");
    spy.mockImplementationOnce(fail as unknown as typeof fetch).mockResolvedValueOnce(proxOk);

    const r = await mexcFetch("https://api.mexc.com/api/v1/contract/ticker?symbol=BTC_USDT");
    expect(r.ok).toBe(true);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy.mock.calls[1][0]).toContain("corsproxy.io");
  });

  it("fallback si status no ok", async () => {
    const bad = new Response("err", { status: 403 });
    const proxOk = new Response(JSON.stringify({ success: true }), { status: 200 });
    const spy = vi.spyOn(global, "fetch").mockResolvedValueOnce(bad).mockResolvedValueOnce(proxOk);
    const r = await mexcFetch("https://api.mexc.com/api/v3/exchangeInfo");
    expect(r.ok).toBe(true);
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
