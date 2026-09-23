import { useEffect } from 'react';
import { t } from '@/i18n';

/**
 * Per-route <title>, description, Open Graph tags and JSON-LD.
 *
 * The tags are updated in place rather than rendered as new elements, so the defaults in
 * index.html (what a crawler that runs no JavaScript sees) are replaced, never duplicated.
 * Leaving a page restores them, so a page that sets nothing never inherits the last one's.
 */
export interface PageMeta {
  /** The page's own title; the site name is appended. Omit on the home page. */
  title?: string;
  description?: string;
  /** Absolute or root-relative image URL for link previews. */
  image?: string;
  /** Structured data (schema.org), serialised into one ld+json script. */
  jsonLd?: Record<string, unknown>;
  /** Keep the page out of search results (the 404 page). */
  noindex?: boolean;
}

const JSON_LD_ID = 'page-jsonld';

function setMeta(attr: 'name' | 'property', key: string, value: string | null) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (value == null) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    document.head.appendChild(el);
  }
  el.href = href;
}

function apply(meta: PageMeta) {
  const title = meta.title ? `${meta.title} · ${t('brand.full')}` : t('meta.defaultTitle');
  const description = meta.description ?? t('meta.defaultDescription');
  document.title = title;
  setMeta('name', 'description', description);
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:type', meta.jsonLd ? 'article' : 'website');
  setMeta('property', 'og:site_name', t('brand.full'));
  setMeta('property', 'og:image', meta.image ? new URL(meta.image, location.origin).href : null);
  setMeta('name', 'twitter:card', meta.image ? 'summary_large_image' : 'summary');
  setMeta('name', 'robots', meta.noindex ? 'noindex' : null);
  setCanonical(location.origin + location.pathname);

  document.getElementById(JSON_LD_ID)?.remove();
  if (meta.jsonLd) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = JSON_LD_ID;
    script.textContent = JSON.stringify({ '@context': 'https://schema.org', ...meta.jsonLd });
    document.head.appendChild(script);
  }
}

export function usePageMeta(meta: PageMeta) {
  // Serialised so a new object literal on every render does not re-run the effect.
  const key = JSON.stringify(meta);
  useEffect(() => {
    apply(JSON.parse(key) as PageMeta);
    return () => apply({});
  }, [key]);
}

/** The publisher, as schema.org wants it on every course and lesson. */
export function publisher() {
  return { '@type': 'Organization', name: t('brand.full'), url: location.origin };
}

/** Minutes as an ISO 8601 duration, e.g. 90 -> "PT90M". */
export const isoMinutes = (minutes: number) => `PT${Math.round(minutes)}M`;
