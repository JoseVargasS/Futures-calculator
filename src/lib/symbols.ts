export function normalizeSym(s: string): string {
  return (s || "").toUpperCase().replace(/[\s/_]/g, "");
}

export function displaySym(sym: string, market: string): string {
  if (market === "FUTURES") return sym.replace("_", "");
  return sym.replace("_", "").replace("USDT", " / USDT");
}

export function displayInputSym(sym: string): string {
  return sym.replace("_", "");
}

export function toTvSymbol(sym: string): string {
  return sym.replace("_", "");
}
