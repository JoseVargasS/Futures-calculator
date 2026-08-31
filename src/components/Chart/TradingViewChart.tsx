import { useEffect, memo } from "react";
import { toTvSymbol } from "@/lib/symbols";

declare global {
  interface Window {
    TradingView?: { widget: new (opts: Record<string, unknown>) => unknown };
  }
}

type Props = {
  symbol: string;
  exchange: "MEXC" | "BINANCE";
  locale?: string;
};

export const TradingViewChart = memo(function TradingViewChart({ symbol, exchange, locale = "es" }: Props) {
  useEffect(() => {
    // defer heavy widget creation to keep UI fluid on lang change
    const id = requestAnimationFrame(() => {
      const container = document.getElementById("tradingview_container");
      if (!container) return;
      container.innerHTML = "";
      const tvSym = toTvSymbol(symbol);
      const prefix = exchange === "MEXC" ? "MEXC:" : "BINANCE:";
      if (!window.TradingView) return;
      new window.TradingView.widget({
        autosize: true,
        symbol: prefix + tvSym,
        interval: "15",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale,
        toolbar_bg: "#1e2329",
        enable_publishing: false,
        withdateranges: true,
        hide_side_toolbar: false,
        allow_symbol_change: true,
        details: true,
        hotlist: true,
        container_id: "tradingview_container",
        studies: ["STD;SMA", "STD;RSI"],
      });
    });
    return () => cancelAnimationFrame(id);
  }, [symbol, exchange, locale]);

  return <div id="tradingview_container" className="h-[600px] min-h-[600px] w-full flex-1 overflow-hidden rounded-lg border border-binanceBorder bg-binanceBg lg:h-[820px] xl:h-[88vh]" />;
});
