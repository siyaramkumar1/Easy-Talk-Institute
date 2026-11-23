/**
 * Image optimization utilities for Easy Talk Institute
 * Automatically injects Cloudinary transformations (f_auto, q_auto)
 * and responsive sizing parameters to ensure fast FCP and zero layout shifts.
 */

export function optimizeImageUrl(url: string | undefined | null, width?: number): string {
  if (!url || typeof url !== 'string') return '';

  // Cloudinary image URL optimization
  if (url.includes('res.cloudinary.com')) {
    // Check if transformations already exist in upload path
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex !== -1 && !url.includes('/upload/f_auto')) {
      const transformParams = width 
        ? `f_auto,q_auto,w_${width},c_limit` 
        : 'f_auto,q_auto';
      return url.replace('/upload/', `/upload/${transformParams}/`);
    }
    return url;
  }

  // Unsplash image optimization
  if (url.includes('images.unsplash.com')) {
    const hasParams = url.includes('?');
    const separator = hasParams ? '&' : '?';
    const params = width 
      ? `auto=format&fit=crop&q=80&w=${width}`
      : 'auto=format&fit=crop&q=80';
    if (!url.includes('auto=format')) {
      return `${url}${separator}${params}`;
    }
  }

  return url;
}
