const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];

export function isImageUrl(value: unknown): value is string {
  if (typeof value !== 'string' || !value) return false;
  const extension = value.split('.').pop()?.toLowerCase() || '';
  return IMAGE_EXTENSIONS.includes(extension);
}

/** Every image URL in a document, in field order. Looks inside arrays and nested objects. */
export function collectImageUrls(value: unknown, urls: string[] = []): string[] {
  if (isImageUrl(value)) {
    urls.push(value);
  } else if (Array.isArray(value)) {
    value.forEach((v) => collectImageUrls(v, urls));
  } else if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, v]) => {
      if (!key.startsWith('_')) collectImageUrls(v, urls);
    });
  }
  return urls;
}
