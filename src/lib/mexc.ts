// ponytail: MEXC nunca manda headers CORS → proxy-first para no ensuciar la
// consola con errores que el navegador imprime igual aunque se atrapen.
// Cadena: allorigins → corsproxy → r.jina.ai (este envuelve el JSON en
// markdown y se extrae); gana el primero con r.ok. Binance va directo.
async function viaAllOrigins(u: string): Promise<Response> {
  return fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`);
}

async function viaCorsProxy(u: string): Promise<Response> {
  return fetch(`https://corsproxy.io/?${encodeURIComponent(u)}`);
}

async function viaJina(u: string): Promise<Response> {
  const r = await fetch(`https://r.jina.ai/${u}`);
  const text = await r.text();
  const s = text.indexOf("{");
  const e = text.lastIndexOf("}");
  if (!r.ok || s < 0 || e < 0) throw new Error(`jina ${r.status}`);
  return new Response(text.slice(s, e + 1), { status: 200, headers: { "content-type": "application/json" } });
}

const MEXC_CHAIN = [viaAllOrigins, viaCorsProxy, viaJina];

function isMexcHost(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith("mexc.com");
  } catch {
    return url.includes("mexc.com");
  }
}

export async function mexcFetch(url: string): Promise<Response> {
  if (!isMexcHost(url)) {
    const direct = await fetch(url);
    if (direct.ok) return direct;
  }
  let lastErr: unknown = new Error("all fetch attempts failed");
  for (const via of MEXC_CHAIN) {
    try {
      const r = await via(url);
      if (r.ok) return r;
      lastErr = new Error(`http ${r.status}`);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}
