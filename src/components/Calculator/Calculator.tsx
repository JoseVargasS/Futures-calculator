import { useMemo, useState, useEffect, useCallback } from "react";
import { fmtPrice, fmtPriceInput } from "@/lib/formatPrice";
import { useI18n } from "@/i18n/context";

type Direction = "LONG" | "SHORT";
type TpSlMode = "PRICE" | "PCT";

type Props = {
  livePrice: number;
};

// ponytail: lista fija, sin lib extra
const LEVERAGES: number[] = [
  ...Array.from({ length: 50 }, (_, i) => i + 1),
  ...Array.from({ length: 10 }, (_, i) => 55 + i * 5),
  ...Array.from({ length: 20 }, (_, i) => 110 + i * 10),
  ...Array.from({ length: 10 }, (_, i) => 320 + i * 20),
  ...Array.from({ length: 10 }, (_, i) => 550 + i * 50),
];

export function Calculator({ livePrice }: Props) {
  const { t } = useI18n();
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

  useEffect(() => {
    if (tpSlMode === "PRICE") {
      // keep inputs controlled
    }
  }, [tpSlMode]);

  const rr = Math.abs(slLossUsd) > 0 ? tpProfitUsd / Math.abs(slLossUsd) : 0;
  const badge =
    rr >= 2
      ? { label: t.calculator.badgeExcellent, cls: "bg-accentGreen/20 text-accentGreen border-accentGreen/30" }
      : rr >= 1.5
        ? { label: t.calculator.badgeAcceptable, cls: "bg-white/10 text-white border-white/20" }
        : { label: t.calculator.badgeUnfavorable, cls: "bg-accentRed/20 text-accentRed border-accentRed/30" };

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
      <section className="animate-rise space-y-3 rounded-xl border border-white/10 bg-surface p-3 shadow-xl sm:space-y-4 sm:p-4" style={{ ["--rise-delay" as string]: "90ms" }}>
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-white">{t.calculator.title}</h2>
          <div className="flex items-center gap-0.5 rounded-full bg-field p-1" role="group" aria-label="TP/SL mode">
            <button onClick={() => setTpSlMode("PRICE")} aria-pressed={tpSlMode === "PRICE"} className={`min-h-8 rounded-full px-2.5 py-1 text-[10px] font-bold transition-all duration-200 ease-out-expo active:scale-[0.97] ${tpSlMode === "PRICE" ? "bg-white/15 text-white" : "text-gray-400 hover:text-white"}`}>{t.calculator.modeDollar}</button>
            <button onClick={() => setTpSlMode("PCT")} aria-pressed={tpSlMode === "PCT"} className={`min-h-8 rounded-full px-2.5 py-1 text-[10px] font-bold transition-all duration-200 ease-out-expo active:scale-[0.97] ${tpSlMode === "PCT" ? "bg-white/15 text-white" : "text-gray-400 hover:text-white"}`}>{t.calculator.modeRoe}</button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1 rounded-full bg-field p-1" role="group" aria-label="Direction">
          <button onClick={() => setDirection("LONG")} aria-pressed={direction === "LONG"} className={`flex min-h-10 sm:min-h-11 items-center justify-center gap-1.5 rounded-full py-2.5 text-sm font-extrabold transition-all duration-200 ease-out-expo active:scale-[0.98] ${direction === "LONG" ? "bg-accentGreen text-white" : "text-gray-400 hover:text-white"}`}>{t.calculator.long} <span aria-hidden="true">↗</span></button>
          <button onClick={() => setDirection("SHORT")} aria-pressed={direction === "SHORT"} className={`flex min-h-10 sm:min-h-11 items-center justify-center gap-1.5 rounded-full py-2.5 text-sm font-extrabold transition-all duration-200 ease-out-expo active:scale-[0.98] ${direction === "SHORT" ? "bg-accentRed text-white" : "text-gray-400 hover:text-white"}`}>{t.calculator.short} <span aria-hidden="true">↘</span></button>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-gray-400">{t.calculator.margin}</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500" aria-hidden="true">$</span>
              <input type="number" value={margin || ""} onChange={(e) => setMargin(parseFloat(e.target.value) || 0)} className="tnum min-h-10 sm:min-h-11 w-full rounded-lg bg-field py-2 pl-7 pr-2 text-sm font-bold text-white outline-none transition-shadow duration-200 focus:ring-2 focus:ring-white/25" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-gray-400">{t.calculator.leverage}</label>
            <select value={leverage} onChange={(e) => setLeverage(parseInt(e.target.value))} className="tnum min-h-10 sm:min-h-11 w-full cursor-pointer rounded-lg bg-field px-3 py-2 text-sm font-bold text-white outline-none transition-shadow duration-200 focus:ring-2 focus:ring-white/25">
              {LEVERAGES.map((v) => (
                <option key={v} value={v}>{v}x</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-[11px] font-semibold text-gray-400">{t.calculator.entryPrice}</label>
            <span className="tnum font-mono text-[10px] text-gray-500">{tokens.toFixed(4)} {t.calculator.contracts}</span>
          </div>
          <input type="number" value={entry} onChange={(e) => setEntry(parseFloat(e.target.value) || 0)} className="tnum min-h-10 sm:min-h-11 w-full rounded-lg bg-field px-3 py-2 text-sm font-bold text-white outline-none transition-shadow duration-200 focus:ring-2 focus:ring-white/25" />
        </div>

        {tpSlMode === "PRICE" ? (
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-accentGreen">{t.calculator.takeProfit}</label>
              <input type="number" value={tpPrice} onChange={(e) => setTpPrice(parseFloat(e.target.value) || 0)} className="tnum min-h-10 sm:min-h-11 w-full rounded-lg bg-field px-3 py-2 text-sm font-bold text-accentGreen outline-none transition-shadow duration-200 focus:ring-2 focus:ring-accentGreen/40" />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-accentRed">{t.calculator.stopLoss}</label>
              <input type="number" value={slPrice} onChange={(e) => setSlPrice(parseFloat(e.target.value) || 0)} className="tnum min-h-10 sm:min-h-11 w-full rounded-lg bg-field px-3 py-2 text-sm font-bold text-accentRed outline-none transition-shadow duration-200 focus:ring-2 focus:ring-accentRed/40" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-accentGreen">{t.calculator.targetRoe}</label>
              <div className="relative">
                <input type="number" value={tpPct} onChange={(e) => setTpPct(parseFloat(e.target.value) || 0)} className="tnum min-h-10 sm:min-h-11 w-full rounded-lg bg-field py-2 pl-3 pr-7 text-sm font-bold text-accentGreen outline-none transition-shadow duration-200 focus:ring-2 focus:ring-accentGreen/40" />
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-accentGreen" aria-hidden="true">%</span>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-accentRed">{t.calculator.limitRoe}</label>
              <div className="relative">
                <input type="number" value={slPct} onChange={(e) => setSlPct(parseFloat(e.target.value) || 0)} className="tnum min-h-10 sm:min-h-11 w-full rounded-lg bg-field py-2 pl-3 pr-7 text-sm font-bold text-accentRed outline-none transition-shadow duration-200 focus:ring-2 focus:ring-accentRed/40" />
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-accentRed" aria-hidden="true">%</span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3 rounded-xl bg-black/40 p-3 sm:p-3.5">
          <div className="grid grid-cols-2 gap-2 border-b border-white/5 pb-2.5 text-xs">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500">{t.calculator.positionValue}</span>
              <span className="tnum text-sm font-extrabold text-white">${posValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500">{t.calculator.liquidationPrice}</span>
              <span className="tnum text-sm font-extrabold text-white">{fmtPrice(liq)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-accentGreenBg p-2.5">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-accentGreen">{t.calculator.tpTargetProfit}</span>
              <span className="tnum text-base font-extrabold text-accentGreen">+${Math.abs(tpProfitUsd).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="text-right">
              <span className="tnum block text-xs font-extrabold text-accentGreen">+{tpRoe.toFixed(2)}% ROE</span>
              <span className="tnum block text-[10px] text-gray-400">{t.calculator.tpPrice}: {fmtPrice(tpSlMode === "PRICE" ? tpPrice : syncedTpPrice)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-accentRedBg p-2.5">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-accentRed">{t.calculator.slLimitRisk}</span>
              <span className="tnum text-base font-extrabold text-accentRed">-${Math.abs(slLossUsd).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="text-right">
              <span className="tnum block text-xs font-extrabold text-accentRed">-{Math.abs(slRoe).toFixed(2)}% ROE</span>
              <span className="tnum block text-[10px] text-gray-400">{t.calculator.slPrice}: {fmtPrice(tpSlMode === "PRICE" ? slPrice : syncedSlPrice)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="font-medium text-gray-400">{t.calculator.riskReward}</span>
            <div className="flex items-center gap-2">
              <span className="tnum text-sm font-extrabold text-white">{rr > 0 ? rr.toFixed(2) : "0.00"} : 1</span>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${badge.cls}`}>{badge.label}</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
