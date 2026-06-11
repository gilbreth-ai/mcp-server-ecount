const ALLOWED_ECOUNT_HOST_SUFFIX = '.ecount.com';
const ALLOWED_ECOUNT_HOST = 'ecount.com';

export function assertAllowedEcountUrl(url: string): void {
  const parsed = new URL(url);
  const hostname = parsed.hostname.toLowerCase();

  if (hostname === ALLOWED_ECOUNT_HOST || hostname.endsWith(ALLOWED_ECOUNT_HOST_SUFFIX)) {
    return;
  }

  throw new Error(`Blocked non-ECOUNT network request: ${hostname}`);
}
