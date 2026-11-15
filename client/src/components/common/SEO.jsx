import { useEffect } from 'react';

export default function SEO({
  title,
  description = 'The Golden Circle is the invite-only startup ecosystem platform where high-growth founders, vetted talent, and elite angel syndicates connect.',
  image = '/assets/og-image.png',
  type = 'website',
  url = window.location.href,
}) {
  useEffect(() => {
    // Set document title
    const formattedTitle = title
      ? `${title} | The Golden Circle`
      : 'The Golden Circle | Where Startups Meet Talent & Capital';
    document.title = formattedTitle;

    // Helper to update or create meta tag
    const setMetaTag = (attrName, attrValue, content) => {
      let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Standard Meta
    setMetaTag('name', 'description', description);

    // OpenGraph Meta
    setMetaTag('property', 'og:title', formattedTitle);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:type', type);
    setMetaTag('property', 'og:url', url);
    if (image) setMetaTag('property', 'og:image', image);

    // Twitter Card Meta
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', formattedTitle);
    setMetaTag('name', 'twitter:description', description);
    if (image) setMetaTag('name', 'twitter:image', image);

    // Canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);
  }, [title, description, image, type, url]);

  return null;
}
