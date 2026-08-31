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
    <section className="flex items-center justify-between rounded-xl border border-binanceBorder bg-binanceCard p-4 shadow-lg">
      <div>
        <span className="block text-[11px] font-medium uppercase tracking-wider text-gray-400">{t.ticker.live} {exchange} — {market}</span>
        <div className="mt-0.5 flex items-baseline gap-2">
          <span className="text-2xl font-black tracking-tight text-accentYellow">{price ? fmtPrice(price) : "$--.--"}</span>
          <span className={`text-xs font-semibold ${changePct >= 0 ? "text-accentGreen" : "text-accentRed"}`}>{changePct >= 0 ? `+${changePct.toFixed(2)}%` : `${changePct.toFixed(2)}%`}</span>
        </div>
      </div>
      <button onClick={triggerFix} className="flex items-center gap-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs font-semibold text-accentYellow shadow transition hover:bg-gray-700 active:scale-95">
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        <span>{t.ticker.setEntry}</span>
      </button>
    </section>
  );
});
