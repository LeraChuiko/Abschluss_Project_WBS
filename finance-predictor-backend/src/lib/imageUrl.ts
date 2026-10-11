const unsplashPage =
  /unsplash\.com\/(?:[a-z]{2}\/)?(?:fotos|photos)\/([^/?#\s]+)/i;

export const unsplashPhotoId = (url: string): string | null => {
  const found = url.match(/https?:\/\/[^\s]+/i)?.[0] ?? url;
  const match = found.match(unsplashPage);
  if (!match?.[1]) {
    return null;
  }
  const slug = match[1];
  const id = slug.includes('-') ? slug.slice(slug.lastIndexOf('-') + 1) : slug;
  if (!id || !/^[A-Za-z0-9_-]{5,}$/.test(id)) {
    return null;
  }
  return id;
};

export const resolveImageUrl = async (url: string): Promise<string> => {
  const trimmed = url.trim();
  if (!trimmed) {
    return '';
  }
  if (trimmed.includes('images.unsplash.com')) {
    return trimmed;
  }
  const id = unsplashPhotoId(trimmed);
  if (!id) {
    return trimmed;
  }
  const download = `https://unsplash.com/photos/${id}/download?force=true&w=1200`;
  try {
    const res = await fetch(download, { redirect: 'manual' });
    const location = res.headers.get('location');
    if (location) {
      return location;
    }
  } catch {
    return download;
  }
  return download;
};
