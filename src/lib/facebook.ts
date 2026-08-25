const FACEBOOK_HOSTS = new Set([
  "facebook.com",
  "www.facebook.com",
  "m.facebook.com",
  "web.facebook.com",
  "fb.watch",
]);

export function isFacebookUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return FACEBOOK_HOSTS.has(hostname.toLowerCase());
  } catch {
    return false;
  }
}
