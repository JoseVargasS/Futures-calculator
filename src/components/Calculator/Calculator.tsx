import { useMemo, useState, useEffect, useCallback } from "react";
import { fmtPrice, fmtPriceInput } from "@/lib/formatPrice";

type Direction = "LONG" | "SHORT";
type TpSlMode = "PRICE" | "PCT";

type Props = {
  livePrice: number;
};

export function Calculator({ livePrice }: Props) {
  const [direction, setDirection] = useState<Direction>("LONG");
  const [tpSlMode, setTpSlMode] = useState<TpSlMode>("PRICE");
  const [margin, setMargin] = useState(100);
  const [leverage, setLeverage] = useState(20);
  const [entry, setEntry] = useState(65000);
  const [tpPrice, setTpPrice] = useState(68000);
  const [slPrice, setSlPrice] = useState(63500);
  const [tpPct, setTpPct] = useState(92.31);
  const [slPct, setSlPct] = useState(46.15);

  const posValue = margin * leverage;
  const tokens = entry > 0 ? posValue / entry : 0;
  const liq = direction === "LONG" ? entry * (1 - 1 / leverage) : entry * (1 + 1 / leverage);

  // derived
  const { tpRoe, slRoe, tpProfitUsd, slLossUsd } = useMemo(() => {
    let tRoe = 0,
      sRoe = 0;
    if (tpSlMode === "PRICE") {
      const tpDiff = direction === "LONG" ? tpPrice - entry : entry - tpPrice;
      const slDiff = direction === "LONG" ? entry - slPrice : slPrice - entry;
      tRoe = margin > 0 ? (tokens * tpDiff) / margin * 100 : 0;
      sRoe = margin > 0 ? (tokens * slDiff) / margin * 100 : 0;
    } else {
      tRoe = tpPct;
      sRoe = slPct;
    }
    return {
      tpRoe: tRoe,
      slRoe: sRoe,
      tpProfitUsd: (tRoe / 100) * margin,
      slLossUsd: (sRoe / 100) * margin,
    };
  }, [tpSlMode, direction, tpPrice, slPrice, entry, tokens, margin, tpPct, slPct]);

  // sync PCT when in PRICE mode is done via inputs, but we also need to keep tpPrice/slPrice synced when in PCT mode
  const syncedTpPrice = useMemo(() => {
    if (tpSlMode === "PCT") {
      const move = tpPct / leverage;
      return direction === "LONG" ? entry * (1 + move / 100) : entry * (1 - move / 100);
    }
    return tpPrice;
  }, [tpSlMode, tpPct, leverage, direction, entry, tpPrice]);

  const syncedSlPrice = useMemo(() => {
    if (tpSlMode === "PCT") {
      const move = slPct / leverage;
      return direction === "LONG" ? entry * (1 - move / 100) : entry * (1 + move / 100);
    }
    return slPrice;
  }, [tpSlMode, slPct, leverage, direction, entry, slPrice]);

  // Keep PCT inputs in sync when price mode changes (avoid infinite loop, update on entry change)
  useEffect(() => {
    if (tpSlMode === "PRICE") {
      // nothing, tpRoe derived already displayed as text, but we need to allow editing? we keep inputs as controlled
    }
  }, [tpSlMode]);

  const rr = Math.abs(slLossUsd) > 0 ? tpProfitUsd / Math.abs(slLossUsd) : 0;
  const badge =
    rr >= 2 ? { label: "EXCELENTE", cls: "bg-accentGreen/20 text-accentGreen border-accentGreen/30" } :
    rr >= 1.5 ? { label: "ACEPTABLE", cls: "bg-accentYellow/20 text-accentYellow border-accentYellow/30" } :
    { label: "DESFAVORABLE", cls: "bg-accentRed/20 text-accentRed border-accentRed/30" };

  const fixEntry = useCallback(() => {
    if (livePrice > 0) {
      setEntry(parseFloat(fmtPriceInput(livePrice)));
      if (direction === "LONG") {
        setTpPrice(parseFloat(fmtPriceInput(livePrice * 1.03)));
        setSlPrice(parseFloat(fmtPriceInput(livePrice * 0.985)));
      } else {
        setTpPrice(parseFloat(fmtPriceInput(livePrice * 0.97)));
        setSlPrice(parseFloat(fmtPriceInput(livePrice * 1.015)));
      }
    }
  }, [livePrice, direction]);

  useEffect(() => {
    const handler = () => fixEntry();
    window.addEventListener("fix-entry", handler);
    return () => window.removeEventListener("fix-entry", handler);
  }, [fixEntry]);

  return (
    <>
      {/* Ticker mini is handled outside, but calculator includes direction, inputs */}
      <section className="space-y-4 rounded-xl border border-binanceBorder bg-binanceCard p-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-binanceBorder pb-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-300">Calculadora de Operación</h2>
          <div className="flex items-center rounded-lg border border-binanceBorder bg-binanceBg p-0.5">
            <button onClick={() => setTpSlMode("PRICE")} className={`rounded px-2 py-0.5 text-[10px] font-bold ${tpSlMode === "PRICE" ? "border border-gray-700 bg-binanceInput text-accentYellow" : "text-gray-400 hover:text-white"}`}>Modo $</button>
            <button onClick={() => setTpSlMode("PCT")} className={`rounded px-2 py-0.5 text-[10px] font-bold ${tpSlMode === "PCT" ? "border border-gray-700 bg-binanceInput text-accentYellow" : "text-gray-400 hover:text-white"}`}>Modo ROE %</button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-lg border border-binanceBorder bg-binanceBg p-1">
          <button onClick={() => setDirection("LONG")} className={`flex items-center justify-center gap-1 rounded-md py-2.5 text-sm font-bold transition-all ${direction === "LONG" ? "bg-accentGreen text-gray-950 shadow-md" : "text-gray-400 hover:text-white"}`}>LONG <span>↗</span></button>
          <button onClick={() => setDirection("SHORT")} className={`flex items-center justify-center gap-1 rounded-md py-2.5 text-sm font-bold transition-all ${direction === "SHORT" ? "bg-accentRed text-white shadow-md" : "text-gray-400 hover:text-white"}`}>SHORT <span>↘</span></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-gray-400">Margen / Capital ($)</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-sm font-bold text-gray-500">$</span>
              <input type="number" value={margin} onChange={(e) => setMargin(parseFloat(e.target.value) || 0)} className="w-full rounded-lg border border-binanceBorder bg-binanceInput py-2 pl-7 pr-2 text-sm font-bold text-white outline-none transition focus:border-accentYellow" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-gray-400">Apalancamiento</label>
            <select value={leverage} onChange={(e) => setLeverage(parseInt(e.target.value))} className="w-full cursor-pointer rounded-lg border border-binanceBorder bg-binanceInput px-3 py-2 text-sm font-bold text-white outline-none transition focus:border-accentYellow">
              {Array.from({ length: 50 }, (_, i) => i + 1).map((v) => (
                <option key={v} value={v}>{v}x</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-[11px] font-semibold text-gray-400">Precio de Entrada ($)</label>
            <span className="font-mono text-[10px] text-gray-500">{tokens.toFixed(4)} Contratos</span>
          </div>
          <input type="number" value={entry} onChange={(e) => setEntry(parseFloat(e.target.value) || 0)} className="w-full rounded-lg border border-binanceBorder bg-binanceInput px-3 py-2 text-sm font-bold text-white outline-none transition focus:border-accentYellow" />
        </div>

        {tpSlMode === "PRICE" ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-accentGreen">Take Profit ($)</label>
              <input type="number" value={tpPrice} onChange={(e) => setTpPrice(parseFloat(e.target.value) || 0)} className="w-full rounded-lg border border-binanceBorder bg-binanceInput px-3 py-2 text-sm font-bold text-accentGreen outline-none transition focus:border-accentGreen" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-accentRed">Stop Loss ($)</label>
              <input type="number" value={slPrice} onChange={(e) => setSlPrice(parseFloat(e.target.value) || 0)} className="w-full rounded-lg border border-binanceBorder bg-binanceInput px-3 py-2 text-sm font-bold text-accentRed outline-none transition focus:border-accentRed" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-accentGreen">Target ROE (% Ganancia)</label>
              <div className="relative">
                <input type="number" value={tpPct} onChange={(e) => setTpPct(parseFloat(e.target.value) || 0)} className="w-full rounded-lg border border-binanceBorder bg-binanceInput py-2 pl-3 pr-6 text-sm font-bold text-accentGreen outline-none transition focus:border-accentGreen" />
                <span className="absolute right-2.5 top-2 text-xs font-bold text-accentGreen">%</span>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-accentRed">Límite ROE (% Pérdida)</label>
              <div className="relative">
                <input type="number" value={slPct} onChange={(e) => setSlPct(parseFloat(e.target.value) || 0)} className="w-full rounded-lg border border-binanceBorder bg-binanceInput py-2 pl-3 pr-6 text-sm font-bold text-accentRed outline-none transition focus:border-accentRed" />
                <span className="absolute right-2.5 top-2 text-xs font-bold text-accentRed">%</span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3 rounded-xl border border-binanceBorder bg-binanceBg p-3.5">
          <div className="grid grid-cols-2 gap-2 border-b border-binanceBorder pb-2.5 text-xs">
            <div>
              <span className="block text-[10px] font-bold uppercase text-gray-500">Valor Posición</span>
              <span className="text-sm font-extrabold text-white">${posValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase text-gray-500">P. Liquidación Est.</span>
              <span className="text-sm font-extrabold text-accentYellow">{fmtPrice(liq)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-accentGreen/20 bg-accentGreenBg p-2.5">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-accentGreen">Ganancia TP Target</span>
              <span className="text-base font-black text-accentGreen">+${Math.abs(tpProfitUsd).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="text-right">
              <span className="block text-xs font-extrabold text-accentGreen">+{tpRoe.toFixed(2)}% ROE</span>
              <span className="block text-[10px] text-gray-400">Precio TP: {fmtPrice(tpSlMode === "PRICE" ? tpPrice : syncedTpPrice)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-accentRed/20 bg-accentRedBg p-2.5">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-accentRed">Riesgo SL Limit</span>
              <span className="text-base font-black text-accentRed">-${Math.abs(slLossUsd).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="text-right">
              <span className="block text-xs font-extrabold text-accentRed">-{Math.abs(slRoe).toFixed(2)}% ROE</span>
              <span className="block text-[10px] text-gray-400">Precio SL: {fmtPrice(tpSlMode === "PRICE" ? slPrice : syncedSlPrice)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="font-medium text-gray-400">Ratio Riesgo / Beneficio:</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-white">{rr > 0 ? rr.toFixed(2) : "0.00"} : 1</span>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${badge.cls}`}>{badge.label}</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
