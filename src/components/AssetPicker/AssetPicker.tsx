import { useState, useRef, useEffect, useMemo } from "react";
import { normalizeSym, displaySym, displayInputSym } from "@/lib/symbols";

type Props = {
  symbols: string[];
  value: string;
  market: string;
  onSelect: (sym: string) => void;
};

export function AssetPicker({ symbols, value, market, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const normalizedValue = normalizeSym(value);
  const displayValue = displayInputSym(value);

  const filtered = useMemo(() => {
    const q = normalizeSym(query);
    if (!q) return symbols.slice(0, 80);
    return symbols.filter((s) => normalizeSym(s).includes(q)).slice(0, 80);
  }, [symbols, query]);

  const hasMore = useMemo(() => {
    const q = normalizeSym(query);
    const total = q ? symbols.filter((s) => normalizeSym(s).includes(q)).length : symbols.length;
    return total > 80 ? total - 80 : 0;
  }, [symbols, query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const handleSelect = (sym: string) => {
    setQuery("");
    setOpen(false);
    onSelect(sym);
  };

  const handleFocus = () => {
    setOpen(true);
    setQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlight >= 0 && filtered[highlight]) handleSelect(filtered[highlight]);
      else if (filtered[0]) handleSelect(filtered[0]);
    } else if (e.key === "Escape") setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          value={open ? query : displayValue}
          placeholder={open ? "Buscar SUI, BTC..." : "BTCUSDT"}
          onChange={(e) => {
            setQuery(e.target.value.toUpperCase());
            setOpen(true);
          }}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          className="w-[155px] rounded-lg border border-binanceBorder bg-binanceInput py-1.5 pl-8 pr-7 text-sm font-bold uppercase text-white placeholder:font-medium placeholder:text-gray-500 focus:border-accentYellow focus:outline-none sm:w-[200px]"
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-500">{symbols.length} pares</span>
      </div>

      {open && (
        <div className="absolute right-0 z-50 mt-1.5 max-h-[320px] w-full overflow-y-auto rounded-lg border border-binanceBorder bg-binanceCard shadow-2xl">
          {filtered.length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-gray-500">Sin resultados</div>
          ) : (
            filtered.map((sym, idx) => {
              const isCur = normalizeSym(sym) === normalizedValue;
              return (
                <button
                  key={sym}
                  type="button"
                  onClick={() => handleSelect(sym)}
                  className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-xs font-bold transition hover:bg-binanceInput ${highlight === idx ? "!bg-binanceInput !text-accentYellow" : isCur ? "bg-binanceInput text-accentYellow" : "text-gray-300"}`}
                >
                  <span>{displaySym(sym, market)}</span>
                  <span className={`text-[10px] ${isCur ? "text-accentYellow" : "text-gray-500"}`}>{isCur ? "● actual" : ""}</span>
                </button>
              );
            })
          )}
          {hasMore > 0 && (
            <div className="border-t border-binanceBorder px-3 py-1.5 text-center text-[10px] text-gray-500">+{hasMore} más — sigue escribiendo para filtrar</div>
          )}
        </div>
      )}
    </div>
  );
}
