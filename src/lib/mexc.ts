export async function mexcFetch(url: string): Promise<Response> {
  try {
    const r = await fetch(url);
    if (r.ok) return r;
    throw new Error(`http ${r.status}`);
  } catch {
    const prox = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    return fetch(prox);
  }
}
