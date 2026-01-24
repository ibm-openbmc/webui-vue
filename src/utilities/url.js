export function getProxyPrefix() {
  const segs = window.location.pathname.split('/').filter(Boolean);
  const first = segs[0] || '';
  const looksLikeProxyId = /-/.test(first) && /\d/.test(first);
  return looksLikeProxyId ? `/${first}` : '';
}

export function buildApiPath(path) {
  const prefix = getProxyPrefix();
  return `${prefix}${path}`;
}

export function buildWsUrl(path) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const prefix = getProxyPrefix();
  const scheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const host = window.location.host;
  return `${scheme}://${host}${prefix}${cleanPath}`;
}

export function buildUrlNewTab(path) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const prefix = getProxyPrefix();
  const host = window.location.host;
  return `https://${host}${prefix}${cleanPath}`;
}
