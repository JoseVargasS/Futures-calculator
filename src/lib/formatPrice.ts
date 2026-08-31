export function decimalsForPrice(p: number): number {
  if (!isFinite(p) || p <= 0) return 4;
  if (p >= 1) return 2;
  const exp = Math.floor(Math.log10(p));
  return Math.min(Math.max(-exp + 3, 4), 20);
}

export function fmtPrice(p: number): string {
  if (!isFinite(p) || p === 0) return "$0.00";
  if (p >= 1) return "$" + p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const d = decimalsForPrice(p);
  return "$" + p.toFixed(d);
}

export function fmtPriceInput(p: number): string {
  if (!isFinite(p) || p === 0) return "0.0000";
  if (p >= 1) return p.toFixed(2);
  return p.toFixed(decimalsForPrice(p));
}
