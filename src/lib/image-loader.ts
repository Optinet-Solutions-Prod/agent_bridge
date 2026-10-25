/**
 * Image loader for next/image (wired in next.config.ts).
 *
 * Unsplash photos are served straight from Unsplash's imgix CDN at the
 * requested width: it is already optimised, globally cached and never cold,
 * so cards never sit empty while Vercel's optimiser fetches a new size.
 * Everything else (Supabase Storage uploads) keeps going through Vercel's
 * optimiser as before.
 */
export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  if (src.startsWith("https://images.unsplash.com/")) {
    const url = new URL(src);
    url.searchParams.set("auto", "format");
    url.searchParams.set("fit", "crop");
    url.searchParams.set("w", String(width));
    url.searchParams.set("q", String(quality ?? 75));
    return url.toString();
  }
  if (src.startsWith("data:") || src.startsWith("blob:")) return src;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality ?? 75}`;
}

/** A 24px blurred version of an Unsplash photo, for placeholder="blur". */
export function unsplashBlur(src: string) {
  if (!src.startsWith("https://images.unsplash.com/")) return undefined;
  const url = new URL(src);
  url.searchParams.set("auto", "format");
  url.searchParams.set("fit", "crop");
  url.searchParams.set("w", "24");
  url.searchParams.set("q", "20");
  url.searchParams.set("blur", "50");
  return url.toString();
}
