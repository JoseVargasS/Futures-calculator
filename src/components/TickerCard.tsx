import { memo } from "react";
import { fmtPrice } from "@/lib/formatPrice";
import type { Exchange, Market } from "@/hooks/useSymbols";
import { useI18n } from "@/i18n/context";

type Props = {
  exchange: Exchange;
  market: Market;
  price: number;
  changePct: number;
};

export const TickerCard = memo(function TickerCard({ exchange, market, price, changePct }: Props) {
  const { t } = useI18n();
  const triggerFix = () => window.dispatchEvent(new Event("fix-entry"));

  return (
    <section className="animate-rise flex items-center justify-between gap-3 rounded-xl bg-surface p-3 sm:p-4" aria-live="polite">
      <div className="min-w-0">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accentGreen" aria-hidden="true" />
          {t.ticker.live} {exchange} — {market}
        </span>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="tnum text-2xl font-extrabold leading-none tracking-tight text-accentYellow sm:text-[28px]">{price ? fmtPrice(price) : "$--.--"}</span>
          <span className={`tnum text-xs font-bold ${changePct >= 0 ? "text-accentGreen" : "text-accentRed"}`}>{changePct >= 0 ? `▲ +${changePct.toFixed(2)}%` : `▼ ${changePct.toFixed(2)}%`}</span>
        </div>
      </div>
      <button onClick={triggerFix} className="flex min-h-10 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-extrabold text-black transition-all duration-200 ease-out-expo hover:bg-gray-200 active:scale-[0.97] sm:min-h-11">
        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2z" /></svg>
        <span>{t.ticker.setEntry}</span>
      </button>
    </section>
  );
});
