import { useState, useRef, useEffect, useMemo } from "react";
import { normalizeSym, displaySym, displayInputSym } from "@/lib/symbols";
import { useI18n } from "@/i18n/context";

type Props = {
  symbols: string[];
  value: string;
  market: string;
  onSelect: (sym: string) => void;
};

export function AssetPicker({ symbols, value, market, onSelect }: Props) {
  const { t } = useI18n();
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
          placeholder={open ? t.assetPicker.placeholderSearching : t.assetPicker.placeholder}
          onChange={(e) => {
            setQuery(e.target.value.toUpperCase());
            setOpen(true);
          }}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          aria-expanded={open}
          aria-autocomplete="list"
          role="combobox"
          className="tnum min-h-10 w-[155px] rounded-lg bg-field py-1.5 pl-8 pr-7 text-sm font-bold uppercase text-white outline-none transition-shadow duration-200 placeholder:font-medium placeholder:text-gray-500 focus:ring-2 focus:ring-white/25 sm:w-[200px]"
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-500">{symbols.length} {t.assetPicker.pairs}</span>
      </div>

      {open && (
        <div role="listbox" aria-label={t.assetPicker.placeholder} className="glass-fixed animate-rise absolute right-0 z-50 mt-1.5 max-h-[320px] w-full min-w-[220px] origin-top-right overflow-y-auto rounded-lg border border-white/10 shadow-2xl">
          {filtered.length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-gray-500">{t.assetPicker.noResults}</div>
          ) : (
            filtered.map((sym, idx) => {
              const isCur = normalizeSym(sym) === normalizedValue;
              return (
                <button
                  key={sym}
                  type="button"
                  role="option"
                  aria-selected={isCur}
                  onClick={() => handleSelect(sym)}
                  className={`tnum flex min-h-9 w-full items-center justify-between px-3 py-2 text-left text-xs font-bold transition-colors duration-150 hover:bg-white/10 ${highlight === idx ? "!bg-white/10 !text-white" : isCur ? "bg-white/5 text-white" : "text-gray-300"}`}
                >
                  <span>{displaySym(sym, market)}</span>
                  <span className={`text-[10px] ${isCur ? "text-white" : "text-gray-500"}`}>{isCur ? t.assetPicker.current : ""}</span>
                </button>
              );
            })
          )}
          {hasMore > 0 && (
            <div className="border-t border-white/10 px-3 py-1.5 text-center text-[10px] text-gray-500">+{hasMore} {t.assetPicker.more}</div>
          )}
        </div>
      )}
    </div>
  );
}
