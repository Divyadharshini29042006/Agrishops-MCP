/**
 * Standardizes image URLs from the backend to ensure they load correctly in both 
 * local development and production environments.
 * 
 * Handles:
 * 1. Placeholder URLs (placehold.co)
 * 2. Absolute URLs with 'localhost:5000' (redirects them to the actual backend)
 * 3. Relative paths (beginning with /uploads)
 */
export const getPublicImageUrl = (url) => {
  if (!url) return '';
  
  // 1. If it's a placeholder, return as is
  if (url.includes('placehold.co')) return url;

  // 2. If it's a blob/data URL (local preview), return as is
  if (url.startsWith('blob:') || url.startsWith('data:')) return url;

  // 3. Get the base API URL from environment
  // Remove trailing slash if present for consistent joining
  const apiBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

  // 3. Handle absolute URLs containing localhost:5000 (often found in legacy database entries)
  if (url.includes('localhost:5000')) {
    return url.replace('http://localhost:5000', apiBaseUrl);
  }

  // 4. Handle relative paths (e.g. /uploads/image.jpg)
  if (url.startsWith('/uploads')) {
    return `${apiBaseUrl}${url}`;
  }

  // 5. If it's an external URL (already starts with http/https), return as is
  if (url.startsWith('http')) {
    return url;
  }

  // 6. Default: if it's just a filename, assume it's in /uploads
  return `${apiBaseUrl}/uploads/${url}`;
};

export default { getPublicImageUrl };
