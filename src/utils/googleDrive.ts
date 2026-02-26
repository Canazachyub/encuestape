/**
 * Image URL utilities
 * Resolves image URLs - supports data URLs, external URLs, etc.
 */

/**
 * Resolve an image URL - returns it as-is (data URLs, external URLs all work directly)
 */
export function resolveImageUrl(url: string): string {
  if (!url) return '';
  return url;
}
