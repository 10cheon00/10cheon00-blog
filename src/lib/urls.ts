const baseUrl = import.meta.env.BASE_URL;
const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

export function withBase(path = '') {
  return `${normalizedBaseUrl}${path.replace(/^\/+/, '')}`;
}
